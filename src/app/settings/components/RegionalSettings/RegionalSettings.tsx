"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Check, Coins, Globe, Loader2 } from "lucide-react";

import { setStoreCurrency } from "@/app/admin/actions";
import { useLanguage } from "@/hooks/useLanguage";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import { useSupabaseClient } from "@/utils/supabase/client";

import { Feedback, type FeedbackState } from "../shared/Feedback";
import { SectionHeader } from "../shared/SectionHeader";
import { CARD } from "../shared/styles";

export default function RegionalSettings() {
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const { language, setLanguage, t } = useLanguage();

  const [currency, setCurrency] = useState<string>("USD");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingCurrency, setLoadingCurrency] = useState(true);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [languageFeedback, setLanguageFeedback] =
    useState<FeedbackState | null>(null);
  const [currencyFeedback, setCurrencyFeedback] =
    useState<FeedbackState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [{ data: settings }, profileRes] = await Promise.all([
          supabase
            .from("business_public_settings")
            .select("currency")
            .maybeSingle(),
          user?.id
            ? supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        if (cancelled) return;
        if (settings?.currency) {
          setCurrency(String(settings.currency).toUpperCase());
        }
        setIsAdmin(profileRes.data?.role === "admin");
      } finally {
        if (!cancelled) setLoadingCurrency(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id]);

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
    setLanguageFeedback({ kind: "success", message: t.languageSaved });
  };

  const handleSelectCurrency = async (nextCurrency: string) => {
    if (!isAdmin || savingCurrency || nextCurrency === currency) return;

    setSavingCurrency(true);
    setCurrencyFeedback(null);

    const res = await setStoreCurrency(nextCurrency);
    setSavingCurrency(false);

    if (!res.ok) {
      setCurrencyFeedback({
        kind: "error",
        message: res.error ?? "Could not update currency.",
      });
      return;
    }

    setCurrency(res.currency ?? nextCurrency);
    setCurrencyFeedback({ kind: "success", message: t.currencySaved });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t.regionalTitle}
        accent={t.regionalAccent}
        description={t.regionalDescription}
      />

      <div className={`${CARD} space-y-5`}>
        <div className="flex items-center gap-2.5">
          <Globe size={18} className="text-cafe-accent" aria-hidden="true" />
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
            {t.languageHeading}
          </h2>
        </div>

        <div
          role="radiogroup"
          aria-label={t.languageHeading}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {SUPPORTED_LANGUAGES.map((option) => {
            const isActive = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => handleSelectLanguage(option.code)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-4 text-left transition-all",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
                  isActive
                    ? "border-cafe-accent bg-white shadow-md shadow-cafe-accent/5 dark:bg-zinc-900"
                    : "border-zinc-200 bg-[#F5F5F1] hover:border-zinc-300 dark:border-white/5 dark:bg-zinc-950/60 dark:hover:border-white/10",
                )}
              >
                <div>
                  <span className="block text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                    {option.nativeLabel}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    {option.label}
                  </span>
                </div>

                {isActive && (
                  <Check
                    size={16}
                    strokeWidth={3.5}
                    aria-hidden="true"
                    className="text-cafe-accent"
                  />
                )}
              </button>
            );
          })}
        </div>

        <Feedback feedback={languageFeedback} />
      </div>

      <div className={`${CARD} space-y-5`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Coins size={18} className="text-cafe-accent" aria-hidden="true" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              {t.currencyHeading}
            </h2>
          </div>

          {savingCurrency && (
            <Loader2
              size={16}
              className="animate-spin text-cafe-accent"
              aria-hidden="true"
            />
          )}
        </div>

        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {isAdmin ? t.currencyAdminHint : t.currencyCustomerHint}
        </p>

        {loadingCurrency ? (
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Loading currency...
          </div>
        ) : (
          <div
            role="radiogroup"
            aria-label={t.currencyHeading}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          >
            {SUPPORTED_CURRENCIES.map((item) => {
              const isActive = item.code === currency;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  disabled={!isAdmin || savingCurrency}
                  onClick={() => void handleSelectCurrency(item.code)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
                    "disabled:cursor-not-allowed",
                    isActive
                      ? "border-cafe-accent bg-white shadow-md shadow-cafe-accent/5 dark:bg-zinc-900"
                      : "border-zinc-200 bg-[#F5F5F1] opacity-75 hover:border-zinc-300 dark:border-white/5 dark:bg-zinc-950/60 dark:hover:border-white/10",
                  )}
                >
                  <div>
                    <span className="block text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                      {item.symbol} {item.code}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      {item.label}
                    </span>
                  </div>

                  {isActive && (
                    <Check
                      size={14}
                      strokeWidth={3.5}
                      aria-hidden="true"
                      className="text-cafe-accent"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <Feedback feedback={currencyFeedback} />
      </div>
    </div>
  );
}