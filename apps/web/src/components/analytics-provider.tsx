"use client";

import { useEffect, useRef } from "react";

const POSTHOG_HOST = "https://app.posthog.com";
const CONSENT_KEY = "cookie_consent";

function initPostHog(key: string) {
  if ((window as unknown as Record<string, unknown>).posthog) return;

  const script = document.createElement("script");
  script.src = `${POSTHOG_HOST}/static/array.js`;
  script.async = true;
  script.onload = () => {
    const ph = (window as unknown as Record<string, unknown>).posthog as
      | { init?: (key: string, options: Record<string, unknown>) => void }
      | undefined;
    ph?.init?.(key, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false,
      persistence: "localStorage",
    });
  };
  document.head.appendChild(script);
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const initialised = useRef(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    // Initialise on mount if consent was already given
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === "accepted" && !initialised.current) {
      initialised.current = true;
      initPostHog(key);
    }

    // Listen for dynamic consent changes (fired by ConsentBanner)
    function handleConsentChanged(e: Event) {
      const { value } = (e as CustomEvent<{ value: string }>).detail;
      if (value === "accepted" && !initialised.current) {
        initialised.current = true;
        initPostHog(key!);
      }
      // When declined we simply don't load PostHog — no opt-out call needed
      // because it was never initialised.
    }

    window.addEventListener("cookie_consent_changed", handleConsentChanged);
    return () => {
      window.removeEventListener("cookie_consent_changed", handleConsentChanged);
    };
  }, []);

  return <>{children}</>;
}
