import { memo } from "react";

import { cn } from "@/lib/utils";

/**
 * The assistant's avatar: the site favicon, which Next.js serves from
 * `src/app/icon.svg` at `/icon.svg`. The image fills the whole circle (the
 * round clip crops its corners), so it reads as a round icon rather than a
 * square sitting inside a circle. Message bubbles and the thinking indicator
 * both use it, so the two always match.
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
        "block h-7 w-7 shrink-0 overflow-hidden rounded-full bg-cafe-card",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a 28px static SVG gains nothing from next/image */}
      <img
        src={BOT_AVATAR_SRC}
        alt=""
        width={28}
        height={28}
        draggable={false}
        className="h-full w-full object-cover"
      />
    </span>
  );
});

BotAvatar.displayName = "BotAvatar";
