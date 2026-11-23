"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  type SupportedLanguage,
} from "@/lib/i18n/translations";

const STORAGE_KEY = "cafe-language";
const LANGUAGE_EVENT = "cafe_language_change";

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === value);
}

function getSnapshot(): SupportedLanguage {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isSupportedLanguage(saved) ? saved : "en";
  } catch {
    return "en";
  }
}

function getServerSnapshot(): SupportedLanguage {
  return "en";
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
  const language = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

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