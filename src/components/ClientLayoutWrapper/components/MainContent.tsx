import type { ReactNode } from "react";

import { buildMainClassName } from "../styles";

interface MainContentProps {
  hideHeader: boolean;
  children: ReactNode;
}

export function MainContent({ hideHeader, children }: MainContentProps) {
  return <main className={buildMainClassName(hideHeader)}>{children}</main>;
}