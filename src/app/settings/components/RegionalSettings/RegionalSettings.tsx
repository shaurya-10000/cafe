"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Coins, Globe, Loader2, RotateCcw } from "lucide-react";

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

const USER_CURRENCY_KEY = "cafe-user-currency";
const CURRENCY_EVENT = "cafe_user_currency_change";

function getUserCurrencySnapshot(): string | null {
  try {
    const val = window.localStorage.getItem(USER_CURRENCY_KEY);
    return val && /^[A-Z]{3}$/.test(val) ? val : null;
  } catch {
    return null;
  }
}

function getServerCurrencySnapshot(): string | null {
  return null;
}

function subscribeCurrency(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(CURRENCY_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CURRENCY_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export default function RegionalSettings() {
  const supabase = useSupabaseClient();
  const { language, hasUserOverride, setLanguage, t } = useLanguage();

  const userCurrencyOverride = useSyncExternalStore(
    subscribeCurrency,
    getUserCurrencySnapshot,
    getServerCurrencySnapshot,
  );
  const [storeCurrency, setStoreCurrency] = useState<string>("USD");
  const [loadingCurrency, setLoadingCurrency] = useState(true);
  const [languageFeedback, setLanguageFeedback] =
    useState<FeedbackState | null>(null);
  const [currencyFeedback, setCurrencyFeedback] =
    useState<FeedbackState | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("business_public_settings")
      .select("currency")
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.currency) {
          setStoreCurrency(String(data.currency).toUpperCase());
        }
        setLoadingCurrency(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const activeCurrency = userCurrencyOverride ?? storeCurrency;

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
    setLanguageFeedback({ kind: "success", message: t.languageSaved });
  };

  const handleResetLanguage = () => {
    setLanguage(null);
    setLanguageFeedback({
      kind: "success",
      message: "Reset to cafe default language.",
    });
  };

  const handleSelectCurrency = (code: string) => {
    try {
      window.localStorage.setItem(USER_CURRENCY_KEY, code);
      window.dispatchEvent(new Event(CURRENCY_EVENT));
    } catch {
      // Ignore storage errors
    }
    setCurrencyFeedback({
      kind: "success",
      message: `Personal preference set to ${code}.`,
    });
  };

  const handleResetCurrency = () => {
    try {
      window.localStorage.removeItem(USER_CURRENCY_KEY);
      window.dispatchEvent(new Event(CURRENCY_EVENT));
    } catch {
      // Ignore storage errors
    }
    setCurrencyFeedback({
      kind: "success",
      message: `Reset to cafe default currency (${storeCurrency}).`,
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t.regionalTitle}
        accent={t.regionalAccent}
        description="Customize your personal display language and currency preference (only applies to you)."
      />

      <div className={`${CARD} space-y-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Globe size={18} className="text-cafe-accent" aria-hidden="true" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              {t.languageHeading}
            </h2>
          </div>

          {hasUserOverride && (
            <button
              type="button"
              onClick={handleResetLanguage}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cafe-accent hover:underline"
            >
              <RotateCcw size={12} aria-hidden="true" />
              Use store default
            </button>
          )}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Coins size={18} className="text-cafe-accent" aria-hidden="true" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              Personal Currency Preference
            </h2>
          </div>

          {userCurrencyOverride && (
            <button
              type="button"
              onClick={handleResetCurrency}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cafe-accent hover:underline"
            >
              <RotateCcw size={12} aria-hidden="true" />
              Use store default ({storeCurrency})
            </button>
          )}
        </div>

        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Saved only for your device. Checkout settles in the cafe&apos;s active
          currency ({storeCurrency}).
        </p>

        {loadingCurrency ? (
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Loading currency...
          </div>
        ) : (
          <div
            role="radiogroup"
            aria-label="Personal currency preference"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          >
            {SUPPORTED_CURRENCIES.map((item) => {
              const isActive = item.code === activeCurrency;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => handleSelectCurrency(item.code)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
                    isActive
                      ? "border-cafe-accent bg-white shadow-md shadow-cafe-accent/5 dark:bg-zinc-900"
                      : "border-zinc-200 bg-[#F5F5F1] opacity-80 hover:border-zinc-300 dark:border-white/5 dark:bg-zinc-950/60 dark:hover:border-white/10",
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