import { useState } from "react";
import { Camera } from "lucide-react";

interface AvatarButtonProps {
  readonly avatarUrl: string | null;
  readonly initial: string;
  readonly onClick: () => void;
}

/**
 * Hands off to Clerk's own account UI, which owns avatar upload, storage and
 * CDN. Do not wire a fake upload input here (see api/profileApi.ts).
 */
export function AvatarButton({ avatarUrl, initial, onClick }: AvatarButtonProps) {
  // Remember the URL that failed so a broken image falls back to the initial,
  // and a *new* URL gets a fresh attempt.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = avatarUrl !== null && avatarUrl !== failedUrl;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Change profile photo via your account settings"
      className="group relative h-32 w-32 shrink-0 rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Clerk-hosted CDN image, avoids a next/image remotePatterns dependency
        <img
          src={avatarUrl}
          alt=""
          onError={() => setFailedUrl(avatarUrl)}
          className="h-full w-full rounded-[2rem] object-cover ring-4 ring-[#FAF9F6] transition-all group-hover:opacity-80 dark:ring-zinc-800"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[2rem] bg-cafe-accent/10 text-4xl font-black uppercase text-cafe-accent ring-4 ring-[#FAF9F6] dark:ring-zinc-800">
          {initial}
        </div>
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100"
      >
        <Camera className="text-white" size={24} />
      </div>
    </button>
  );
}
