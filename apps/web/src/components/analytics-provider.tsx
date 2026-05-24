"use client";

import { useEffect } from "react";

const POSTHOG_HOST = "https://app.posthog.com";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    // Skip if already loaded
    if ((window as unknown as Record<string, unknown>).posthog) return;

    // Load PostHog snippet asynchronously
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

    return () => {
      // No cleanup needed — PostHog persists for the session
    };
  }, []);

  return <>{children}</>;
}
