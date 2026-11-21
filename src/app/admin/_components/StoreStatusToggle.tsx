"use client";

import { useEffect, useState } from "react";
import { Power, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { setStoreOpen } from "@/app/admin/actions";
import { useSupabaseClient } from "@/utils/supabase/client";

export function StoreStatusToggle() {
  const supabase = useSupabaseClient();
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("business_public_settings")
      .select("is_open")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setIsOpen(data?.is_open !== false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleToggle = async () => {
    if (isOpen === null || saving) return;
    const next = !isOpen;
    setSaving(true);
    try {
      const res = await setStoreOpen(next);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to update cafe status.");
        return;
      }
      setIsOpen(next);
      toast.success(
        next
          ? "Cafe is now OPEN for orders & reservations."
          : "Cafe is now CLOSED — orders & reservations paused.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (isOpen === null) return null;

  return (
    <div className="border-b border-cafe-border bg-cafe-card/80 px-6 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500"
            }`}
            aria-hidden="true"
          />
          <span className="text-xs font-bold uppercase tracking-widest text-cafe-fg">
            Cafe Status:{" "}
            <span className={isOpen ? "text-emerald-500" : "text-red-500"}>
              {isOpen ? "Open" : "Closed"}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
            isOpen
              ? "border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
              : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          }`}
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          ) : (
            <Power size={13} aria-hidden="true" />
          )}
          {isOpen ? "Close Cafe" : "Open Cafe"}
        </button>
      </div>
    </div>
  );
}