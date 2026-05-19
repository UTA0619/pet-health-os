/**
 * LINE Notify API client
 * Users generate tokens at https://notify-bot.line.me
 * Free tier: 1000 messages/hour per token
 */

export interface LineNotifyResult {
  status: number;
  message: string;
}

export async function sendLineNotify(
  token: string,
  message: string
): Promise<LineNotifyResult> {
  const params = new URLSearchParams({ message });

  const res = await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json().catch(() => ({ message: "Unknown error" }));

  return {
    status: res.status,
    message: data.message ?? "ok",
  };
}
