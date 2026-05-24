/**
 * Lightweight analytics wrapper.
 * Client-side: delegates to window.posthog if available (opt-in).
 * Server-side: sends events to PostHog Capture API via fetch if NEXT_PUBLIC_POSTHOG_KEY is set.
 * No-op in both environments when PostHog is not configured.
 */

const POSTHOG_API_HOST = "https://app.posthog.com";

// Key events
export const EVENTS = {
  HEALTH_LOG_SUBMITTED: "health_log_submitted",
  CAMERA_SCAN_COMPLETED: "camera_scan_completed",
  SCORE_REVEALED: "score_revealed",
  ANOMALY_ALERT_VIEWED: "anomaly_alert_viewed",
  SUBSCRIPTION_STARTED: "subscription_started",
  PET_ADDED: "pet_added",
  USER_SIGNED_UP: "user_signed_up",
} as const;

function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Track an analytics event.
 * Works on both client and server.
 */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (isServer()) {
    // Server-side: send via fetch
    if (!key) return;
    const payload = {
      api_key: key,
      event,
      properties: {
        ...properties,
        $lib: "pet-health-os-server",
      },
      timestamp: new Date().toISOString(),
    };
    // fire-and-forget
    fetch(`${POSTHOG_API_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently ignore network errors in analytics
    });
    return;
  }

  // Client-side: use window.posthog if loaded
  try {
    const ph = (window as unknown as Record<string, unknown>).posthog as
      | {
          capture: (event: string, properties?: Record<string, unknown>) => void;
        }
      | undefined;
    if (ph?.capture) {
      ph.capture(event, properties);
    }
  } catch {
    // Silently ignore
  }
}

/**
 * Identify a user with PostHog.
 * Works on both client and server.
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (isServer()) {
    if (!key) return;
    const payload = {
      api_key: key,
      event: "$identify",
      distinct_id: userId,
      properties: {
        $set: properties ?? {},
      },
    };
    fetch(`${POSTHOG_API_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
    return;
  }

  // Client-side
  try {
    const ph = (window as unknown as Record<string, unknown>).posthog as
      | {
          identify: (
            userId: string,
            properties?: Record<string, unknown>
          ) => void;
        }
      | undefined;
    if (ph?.identify) {
      ph.identify(userId, properties);
    }
  } catch {
    // Silently ignore
  }
}
