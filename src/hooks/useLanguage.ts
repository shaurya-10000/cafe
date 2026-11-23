"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  type SupportedLanguage,
} from "@/lib/i18n/translations";
import { useSupabaseClient } from "@/utils/supabase/client";

const STORAGE_KEY = "cafe-language";
const STORE_LANG_KEY = "cafe-store-language";
const LANGUAGE_EVENT = "cafe_language_change";

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === value);
}

function getOverrideSnapshot(): SupportedLanguage | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isSupportedLanguage(saved) ? saved : null;
  } catch {
    return null;
  }
}

function getServerSnapshot(): SupportedLanguage | null {
  return null;
}

function subscribe(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(LANGUAGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(LANGUAGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useLanguage() {
  const supabase = useSupabaseClient();
  const override = useSyncExternalStore(
    subscribe,
    getOverrideSnapshot,
    getServerSnapshot,
  );
  const [storeDefault, setStoreDefault] = useState<SupportedLanguage>("en");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("business_public_settings")
      .select("default_language")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data && isSupportedLanguage(data.default_language)) {
          setStoreDefault(data.default_language);
          try {
            window.localStorage.setItem(STORE_LANG_KEY, data.default_language);
            window.dispatchEvent(new Event(LANGUAGE_EVENT));
          } catch {}
        }
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const language: SupportedLanguage = override ?? storeDefault;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: SupportedLanguage) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage access failures
    }
    window.dispatchEvent(
      new CustomEvent<SupportedLanguage>(LANGUAGE_EVENT, { detail: next }),
    );
  }, []);

  return {
    language,
    setLanguage,
    t: TRANSLATIONS[language],
  };
}