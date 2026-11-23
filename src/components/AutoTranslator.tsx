"use client";

import { useEffect } from "react";

const USER_LANG_KEY = "cafe-language";
const STORE_LANG_KEY = "cafe-store-language";
const LANGUAGE_EVENT = "cafe_language_change";
const SUPPORTED = new Set(["en", "hi", "es", "fr"]);

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
  "SVG",
]);

function getActiveLanguage(): string {
  try {
    const userLang = window.localStorage.getItem(USER_LANG_KEY);
    if (userLang && SUPPORTED.has(userLang)) return userLang;
    const storeLang = window.localStorage.getItem(STORE_LANG_KEY);
    if (storeLang && SUPPORTED.has(storeLang)) return storeLang;
  } catch {
    // Ignore storage errors
  }
  return "en";
}

function shouldTranslateText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2 || trimmed.length > 450) return false;
  if (!/\p{L}/u.test(trimmed)) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (/^#?[0-9a-f]{6,}$/i.test(trimmed)) return false;
  return true;
}

function loadCache(lang: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(`cafe-i18n-cache-${lang}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function saveCache(lang: string, cache: Record<string, string>): void {
  try {
    const entries = Object.entries(cache).slice(-800);
    window.localStorage.setItem(
      `cafe-i18n-cache-${lang}`,
      JSON.stringify(Object.fromEntries(entries)),
    );
  } catch {
    // Ignore quota errors
  }
}

export function AutoTranslator() {
  useEffect(() => {
    const originalMap = new WeakMap<Text, string>();
    const trackedNodes = new Set<Text>();
    let currentLang = getActiveLanguage();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const collectNodes = (): Text[] => {
      if (!document.body) return [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      const nodes: Text[] = [];
      let node = walker.nextNode();
      while (node) {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        if (
          parent &&
          !SKIP_TAGS.has(parent.tagName) &&
          !parent.closest("[data-no-translate]")
        ) {
          nodes.push(textNode);
        }
        node = walker.nextNode();
      }
      return nodes;
    };

    const restoreEnglish = () => {
      for (const node of trackedNodes) {
        const orig = originalMap.get(node);
        if (orig !== undefined && node.nodeValue !== orig) {
          node.nodeValue = orig;
        }
      }
    };

    const runTranslate = async () => {
      if (disposed) return;
      const lang = getActiveLanguage();
      currentLang = lang;
      document.documentElement.lang = lang;

      if (lang === "en") {
        restoreEnglish();
        return;
      }

      const cache = loadCache(lang);
      const nodes = collectNodes();
      const missingMap = new Map<string, Text[]>();

      for (const node of nodes) {
        const raw = node.nodeValue ?? "";
        if (!originalMap.has(node)) {
          if (!shouldTranslateText(raw)) continue;
          originalMap.set(node, raw);
          trackedNodes.add(node);
        }

        const orig = originalMap.get(node) ?? raw;
        const trimmed = orig.trim();
        if (!shouldTranslateText(trimmed)) continue;

        const cached = cache[trimmed];
        if (cached) {
          const leading = orig.match(/^\s*/)?.[0] ?? "";
          const trailing = orig.match(/\s*$/)?.[0] ?? "";
          const nextValue = `${leading}${cached}${trailing}`;
          if (node.nodeValue !== nextValue) {
            node.nodeValue = nextValue;
          }
        } else {
          const list = missingMap.get(trimmed) ?? [];
          list.push(node);
          missingMap.set(trimmed, list);
        }
      }

      const missingKeys = Array.from(missingMap.keys());
      if (missingKeys.length === 0) return;

      for (let i = 0; i < missingKeys.length; i += 120) {
        if (disposed || getActiveLanguage() !== lang) return;
        const chunk = missingKeys.slice(i, i + 120);
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetLanguage: lang, texts: chunk }),
          });
          if (!res.ok) continue;
          const data = (await res.json()) as { translations?: string[] };
          if (!Array.isArray(data.translations)) continue;
          if (disposed || getActiveLanguage() !== lang) return;

          chunk.forEach((key, idx) => {
            const translated = data.translations?.[idx];
            if (!translated) return;
            cache[key] = translated;
            for (const node of missingMap.get(key) ?? []) {
              const orig = originalMap.get(node) ?? key;
              const leading = orig.match(/^\s*/)?.[0] ?? "";
              const trailing = orig.match(/\s*$/)?.[0] ?? "";
              node.nodeValue = `${leading}${translated}${trailing}`;
            }
          });
          saveCache(lang, cache);
        } catch {
          // Non-fatal: leave original text on network error
        }
      }
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void runTranslate();
      }, 200);
    };

    // Always sync store-wide default language for unsigned visitors on any route
    fetch("/api/store-defaults", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { defaultLanguage?: string } | null) => {
        if (
          !disposed &&
          data?.defaultLanguage &&
          SUPPORTED.has(data.defaultLanguage)
        ) {
          try {
            window.localStorage.setItem(STORE_LANG_KEY, data.defaultLanguage);
          } catch {
            // Ignore storage errors
          }
          if (getActiveLanguage() !== "en") {
            schedule();
          }
        }
      })
      .catch(() => {});

    const observer = new MutationObserver(() => {
      if (getActiveLanguage() !== "en") {
        schedule();
      }
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    const onLangChange = () => {
      const next = getActiveLanguage();
      if (next !== currentLang) {
        restoreEnglish();
      }
      schedule();
    };

    window.addEventListener(LANGUAGE_EVENT, onLangChange);
    window.addEventListener("storage", onLangChange);

    if (currentLang !== "en") {
      schedule();
    }

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener(LANGUAGE_EVENT, onLangChange);
      window.removeEventListener("storage", onLangChange);
    };
  }, []);

  return null;
}