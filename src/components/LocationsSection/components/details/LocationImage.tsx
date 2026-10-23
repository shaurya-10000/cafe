import { useState } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";

interface LocationImageProps {
  name: string;
  imageUrl: string | null;
  priority: boolean;
}

export function LocationImage({ name, imageUrl, priority }: LocationImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-3xl border border-[#EAE9E4] bg-[#F5F5F1] dark:border-zinc-800 dark:bg-zinc-900">
      {imageUrl && !failed ? (
        <Image
          src={imageUrl}
          alt={`${name} location`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={priority}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          aria-hidden="true"
        >
          <MapPin size={28} className="text-cafe-accent" />
        </div>
      )}
    </div>
  );
}
