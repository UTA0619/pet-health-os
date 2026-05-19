/**
 * WhatsApp via Twilio API
 * Requires env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_FROM (e.g. "whatsapp:+14155238886" for sandbox)
 */

export async function sendWhatsApp(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    console.warn("Twilio credentials not configured");
    return { success: false, error: "Twilio not configured" };
  }

  // Normalize phone to whatsapp: format
  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const params = new URLSearchParams({
    To: toFormatted,
    From: from,
    Body: message,
  });

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message ?? "Twilio error" };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
