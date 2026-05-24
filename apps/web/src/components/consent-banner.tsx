"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

const CONSENT_KEY = "cookie_consent";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  function dismiss(accepted: boolean) {
    setHiding(true);
    const value = accepted ? "accepted" : "declined";
    localStorage.setItem(CONSENT_KEY, value);

    if (accepted) {
      trackEvent("cookie_consent_accepted");
    }

    // Notify AnalyticsProvider so it can init/skip PostHog dynamically
    window.dispatchEvent(
      new CustomEvent("cookie_consent_changed", { detail: { value } })
    );

    // Wait for slide-out animation before unmounting
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookieの同意"
      className={[
        "fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 text-white px-4 py-4 shadow-2xl",
        "transition-transform duration-300 ease-in-out",
        hiding ? "translate-y-full" : "translate-y-0",
      ].join(" ")}
    >
      <div className="mx-auto max-w-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-sm text-zinc-300 leading-relaxed">
          🍪 当サービスではアナリティクスCookieを使用します。詳細は{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 text-emerald-400 hover:text-emerald-300"
          >
            プライバシーポリシー
          </Link>
          をご覧ください。
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => dismiss(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 transition-colors"
          >
            同意する
          </button>
          <button
            onClick={() => dismiss(false)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 transition-colors"
          >
            拒否する
          </button>
        </div>
      </div>
    </div>
  );
}
