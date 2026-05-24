"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa_dismissed";

export function PwaInstaller() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    localStorage.setItem(DISMISSED_KEY, "1");
    if (outcome === "accepted" || outcome === "dismissed") {
      setInstallPrompt(null);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setInstallPrompt(null);
  }

  if (!installPrompt) return null;

  return (
    <button
      onClick={handleInstall}
      onContextMenu={(e) => {
        e.preventDefault();
        handleDismiss();
      }}
      title="長押しで非表示"
      className="fixed bottom-28 right-4 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
      aria-label="アプリをインストール"
    >
      <span>📱</span>
      <span>アプリをインストール</span>
    </button>
  );
}
