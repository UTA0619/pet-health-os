import webpush from "web-push";

const VAPID_PUBLIC_KEY = "BB-iCWxn4KhGdFkEz9LfcI-iBPvFSQrUyS8-_NcbwhlGsMQs0hySpfnTJqxF9xQgVFrVby1_aUYRG8eWVRn5oRg";

function getWebPush() {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@pethealthos.com";
  if (!privateKey) {
    console.warn("[push] VAPID_PRIVATE_KEY not set — push disabled");
    return null;
  }
  webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY, privateKey);
  return webpush;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  actions?: { action: string; title: string }[];
}

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; gone?: boolean }> {
  const wp = getWebPush();
  if (!wp) return { success: false };

  try {
    await wp.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      { TTL: 86400 }
    );
    return { success: true };
  } catch (err: unknown) {
    const error = err as { statusCode?: number };
    // 410 Gone = subscription expired, should be deleted
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      return { success: false, gone: true };
    }
    console.error("[push] Send failed:", err);
    return { success: false };
  }
}

export { VAPID_PUBLIC_KEY };
