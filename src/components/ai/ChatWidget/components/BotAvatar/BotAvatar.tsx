import { memo } from "react";

import { cn } from "@/lib/utils";

/**
 * The assistant's avatar: the site favicon, which Next.js serves from
 * `src/app/icon.svg` at `/icon.svg`. Message bubbles and the thinking
 * indicator both use it, so the two always match.
 */
const BOT_AVATAR_SRC = "/icon.svg";

interface BotAvatarProps {
  readonly className?: string;
}

export const BotAvatar = memo(function BotAvatar({ className }: BotAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden",
        "rounded-full border border-cafe-border bg-cafe-card",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a 20px static SVG gains nothing from next/image */}
      <img
        src={BOT_AVATAR_SRC}
        alt=""
        width={20}
        height={20}
        draggable={false}
        className="h-5 w-5 object-contain"
      />
    </span>
  );
});

BotAvatar.displayName = "BotAvatar";
