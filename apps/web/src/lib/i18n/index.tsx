"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { ja, type Messages } from "./messages/ja";
import { en } from "./messages/en";

type Locale = "ja" | "en";
const messages: Record<Locale, Messages> = { ja, en };

type I18nContextValue = {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue>({
  locale: "ja",
  t: ja,
  setLocale: () => {},
});

export function I18nProvider({ children, defaultLocale = "ja" }: { children: ReactNode; defaultLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    // Read from localStorage on mount
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored && (stored === "ja" || stored === "en")) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    // Also update <html lang> attribute
    document.documentElement.lang = l;
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: messages[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
