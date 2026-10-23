/** Hides the scrollbar on the widget's scroll areas (and the history list). */
export const SIDEBAR_SCROLL_CSS = `
  .sidebar-scroll::-webkit-scrollbar { width: 0px; height: 0px; }
  .sidebar-scroll { scrollbar-width: none; -ms-overflow-style: none; }
`;