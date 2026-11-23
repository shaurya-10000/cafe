"use client";

import { useEffect, useState } from "react";
import { Coins, Globe, Loader2, Power } from "lucide-react";
import { toast } from "sonner";

import {
  setStoreCurrency,
  setStoreLanguage,
  setStoreOpen,
} from "@/app/admin/actions";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n/translations";
import { useSupabaseClient } from "@/utils/supabase/client";

export function StoreStatusToggle() {
  const supabase = useSupabaseClient();
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [currency, setCurrency] = useState<string>("USD");
  const [language, setLanguage] = useState<string>("en");
  const [savingOpen, setSavingOpen] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("business_public_settings")
      .select("is_open, currency, default_language")
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setIsOpen(data?.is_open !== false);
        if (data?.currency) setCurrency(String(data.currency).toUpperCase());
        if (data?.default_language) {
          setLanguage(String(data.default_language).toLowerCase());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleToggleOpen = async () => {
    if (isOpen === null || savingOpen) return;
    const next = !isOpen;
    setSavingOpen(true);
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
      setSavingOpen(false);
    }
  };

  const handleCurrencyChange = async (nextCurrency: string) => {
    if (savingCurrency || nextCurrency === currency) return;
    setSavingCurrency(true);
    try {
      const res = await setStoreCurrency(nextCurrency);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to update currency.");
        return;
      }
      setCurrency(res.currency ?? nextCurrency);
      toast.success(`Store currency set to ${res.currency ?? nextCurrency}.`);
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleLanguageChange = async (nextLang: string) => {
    if (savingLanguage || nextLang === language) return;
    setSavingLanguage(true);
    try {
      const res = await setStoreLanguage(nextLang);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to update default language.");
        return;
      }
      setLanguage(res.language ?? nextLang);
      toast.success("Store default language updated.");
    } finally {
      setSavingLanguage(false);
    }
  };

  if (isOpen === null) return null;

  return (
    <div className="border-b border-cafe-border bg-cafe-card/80 px-6 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isOpen ? "animate-pulse bg-emerald-500" : "bg-red-500"
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

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 rounded-full border border-cafe-border bg-cafe-bg px-3 py-1 text-[11px] font-bold text-cafe-fg">
            <Globe size={13} className="text-cafe-accent" aria-hidden="true" />
            <span className="sr-only">Default language</span>
            <select
              aria-label="Default store language"
              value={language}
              disabled={savingLanguage}
              onChange={(e) => void handleLanguageChange(e.target.value)}
              className="bg-transparent text-[11px] font-black uppercase tracking-wider outline-none"
            >
              {SUPPORTED_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code} className="bg-cafe-card text-cafe-fg">
                  {item.code.toUpperCase()} · {item.nativeLabel}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-1.5 rounded-full border border-cafe-border bg-cafe-bg px-3 py-1 text-[11px] font-bold text-cafe-fg">
            <Coins size={13} className="text-cafe-accent" aria-hidden="true" />
            <span className="sr-only">Store currency</span>
            <select
              aria-label="Store currency"
              value={currency}
              disabled={savingCurrency}
              onChange={(e) => void handleCurrencyChange(e.target.value)}
              className="bg-transparent text-[11px] font-black uppercase tracking-wider outline-none"
            >
              {SUPPORTED_CURRENCIES.map((item) => (
                <option key={item.code} value={item.code} className="bg-cafe-card text-cafe-fg">
                  {item.symbol} {item.code}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleToggleOpen}
            disabled={savingOpen}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
              isOpen
                ? "border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            }`}
          >
            {savingOpen ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              <Power size={13} aria-hidden="true" />
            )}
            {isOpen ? "Close Cafe" : "Open Cafe"}
          </button>
        </div>
      </div>
    </div>
  );
}