import { memo, useState } from "react";

import Image from "next/image";

interface AvatarProps {
  imageUrl?: string | null;
  initial: string;
  alt: string;
}

export const Avatar = memo(function Avatar({
  imageUrl,
  initial,
  alt,
}: AvatarProps) {
  // Remember *which* URL failed instead of a boolean that an effect has to
  // reset: a new URL is simply not the failed one.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = imageUrl != null && failedUrl === imageUrl;

  if (!imageUrl || failed) {
    return (
      <span aria-hidden="true" className="select-none">
        {initial}
      </span>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      sizes="44px"
      className="object-cover"
      onError={() => setFailedUrl(imageUrl)}
      referrerPolicy="no-referrer"
    />
  );
});