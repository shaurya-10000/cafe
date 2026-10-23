// @ts-nocheck — this file runs in ServiceWorkerGlobalScope, not the DOM
// scope the rest of the app's tsconfig targets. Without a "webworker" lib
// config scoped to just this file, TS's editor tooling falls back to the
// generic DOM `Event` type for addEventListener callbacks here, which
// doesn't have `.data`, `.waitUntil()`, etc. — producing false-positive
// errors on correct code. Next.js never type-checks or compiles files
// under public/ anyway; this only silences the editor.
//
// public/sw.js
// Minimal service worker whose only job is to receive Web Push events and
// display a system notification, and route a click on it back into the app.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "New notification", body: event.data.text() };
  }

  const title = payload.title || "Cafe";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url || "/" },
    // Scope collapsing to type+order instead of type alone. This still
    // turns "your order is preparing" → "your order is ready" for THE
    // SAME order into one updating notification, but two different
    // orders reaching the same status no longer overwrite each other.
    // `type`/`orderId` are sent by /api/webhooks/push (falls back to a
    // generic tag if `type` is missing and there's no orderId either).
    tag: payload.orderId
      ? `${payload.type}-${payload.orderId}`
      : payload.type || "cafe-notification",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.includes(self.location.origin) &&
            "focus" in client
          ) {
            // Chained, not fire-and-forget: navigate() returns a promise
            // that can reject (e.g. some permission/lifecycle edge cases),
            // and an unhandled rejection inside a service worker has no
            // one to catch it. Focus only after navigation actually
            // settles.
            return client
              .navigate(targetUrl)
              .then((navigatedClient) => (navigatedClient || client).focus());
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// ─── pushsubscriptionchange: DELIBERATELY NOT HANDLED ──────────────────────
//
// Browsers occasionally rotate a push subscription's endpoint/keys on
// their own (independent of the user unsubscribing or any app code).
// Chrome and Firefox both do this periodically.
//
// Handling that event correctly requires a server-side endpoint the
// service worker can POST the new subscription to — and because the SW
// has no session and can't read env vars, that endpoint would need some
// form of authorization the SW itself can carry. The only workable
// options are (a) skip auth entirely and trust the origin check, or (b)
// inject a shared secret into this static file at serve time.
//
// (a) leaves the endpoint open to any POST that sets a spoofable Origin
//     header — a real auth hole, not a theoretical one.
// (b) requires a route handler that serves this file (or a config
//     script imported into it) and injects PUSH_WEBHOOK_SECRET, which
//     widens the secret's exposure surface for a rare code path.
//
// The failure mode when this event fires and nothing handles it is
// benign: the stale endpoint stays in `push_subscriptions`, the send
// webhook gets 404/410/401 from the push service, and /api/webhooks/push
// deletes the dead row. The user's NotificationsSidebar shows push as
// "unsubscribed", and re-enabling takes one click.
//
// Given the tradeoff — a permanent auth hole for a few-minutes-a-year
// recovery path — the correct call is to not handle this event.