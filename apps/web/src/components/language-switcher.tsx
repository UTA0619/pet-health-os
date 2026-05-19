"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
      {(["ja", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            locale === l
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {l === "ja" ? "日本語" : "English"}
        </button>
      ))}
    </div>
  );
}
