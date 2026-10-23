export function subscribeMql(
  mql: MediaQueryList,
  handler: () => void,
): () => void {
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", handler);

    return () => {
      mql.removeEventListener("change", handler);
    };
  }

  // Legacy MediaQueryList API. The guard covers the rare partial polyfill
  // that exposes neither method.
  if (typeof mql.addListener === "function") {
    mql.addListener(handler);

    return () => {
      mql.removeListener(handler);
    };
  }

  return () => {};
}