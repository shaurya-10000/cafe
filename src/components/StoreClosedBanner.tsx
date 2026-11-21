"use client";

import { useEffect, useState } from "react";
import { MoonStar } from "lucide-react";

import { useSupabaseClient } from "@/utils/supabase/client";

export function StoreClosedBanner() {
  const supabase = useSupabaseClient();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("business_public_settings")
        .select("is_open")
        .maybeSingle();
      if (!cancelled && data && typeof data.is_open === "boolean") {
        setIsOpen(data.is_open);
      }
    };
    void load();

    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [supabase]);

  if (isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-red-500"
    >
      <span className="inline-flex items-center gap-2">
        <MoonStar size={14} aria-hidden="true" />
        We&apos;re currently closed — new orders and reservations are paused.
      </span>
    </div>
  );
}