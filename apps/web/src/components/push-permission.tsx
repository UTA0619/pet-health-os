"use client";
import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";

export function PushPermissionBanner() {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Show banner if: push supported, not granted, not dismissed
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "granted") return;
    if (localStorage.getItem("push-dismissed")) return;
    // Small delay so it doesn't pop up immediately on first load
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  async function handleAllow() {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("通知が許可されませんでした");
        setShow(false);
        return;
      }

      // Get VAPID public key
      const { publicKey } = await fetch("/api/push/vapid-key").then((r) => r.json());

      // Get service worker registration
      const reg = await navigator.serviceWorker.ready;

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
      });

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      // Save subscription to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        }),
      });

      toast.success("🔔 プッシュ通知を有効にしました！");
      setShow(false);
    } catch (err) {
      console.error("[push] Subscribe error:", err);
      toast.error("通知の設定に失敗しました");
    } finally {
      setSubscribing(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem("push-dismissed", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-zinc-100 p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
        <Bell className="h-5 w-5 text-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900">通知を有効にする</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          毎日の健康スコアや異常アラートをプッシュ通知で受け取れます
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAllow}
            disabled={subscribing}
            className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-medium disabled:opacity-50"
          >
            {subscribing ? "設定中..." : "有効にする"}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-500"
          >
            後で
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="text-zinc-400 mt-0.5">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
