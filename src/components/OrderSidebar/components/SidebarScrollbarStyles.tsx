import { memo } from "react";

import { SCROLLBAR_CSS } from "../styles";

export const SidebarScrollbarStyles = memo(function SidebarScrollbarStyles() {
  return <style>{SCROLLBAR_CSS}</style>;
});
