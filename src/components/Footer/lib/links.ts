/** In-page anchors (and "/#anchor" from other routes) use a plain <a>. */
export function isHashAnchor(href: string): boolean {
  return href.startsWith("#") || href.startsWith("/#");
}
