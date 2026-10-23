import type { FC, ReactNode } from "react";

import type { IconProps } from "../types";

interface IconBaseProps extends IconProps {
  children: ReactNode;
}

function IconBase({ size = 24, className, children }: IconBaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Pumpkin: FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 3c.6 1 .6 2 0 3" />
    <path d="M9 4.5c1.2.8 1.2 2.2 0 3" />
    <path d="M4 13c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5-3.6 7-8 7-8-3.4-8-7Z" />
    <path d="M12 6.7V20" />
    <path d="M8 7.8c-1 2-1 9 0 12" />
    <path d="M16 7.8c1 2 1 9 0 12" />
  </IconBase>
);

export const Bat: FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 9c-1.6-2.6-5-3.7-8-2 1.2 1 1.6 2.3 1.2 3.6C3 11.4 2 13.6 2.8 16c1.8-.9 3.6-.7 4.9.6C9 18 10.5 17.8 12 16" />
    <path d="M12 9c1.6-2.6 5-3.7 8-2 1.2 1 1.6 2.3 1.2 3.6C21 11.4 22 13.6 21.2 16c-1.8-.9-3.6-.7-4.9.6C15 18 13.5 17.8 12 16" />
    <path d="M12 9v7" />
  </IconBase>
);

export const Firecracker: FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 22V10a3 3 0 0 1 6 0v12" />
    <path d="M9 22h6" />
    <path d="M12 6V2" />
    <path d="M4.5 4.5 6 6" />
    <path d="M19.5 4.5 18 6" />
    <path d="M3 10h2.5" />
    <path d="M18.5 10H21" />
  </IconBase>
);