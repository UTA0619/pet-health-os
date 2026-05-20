"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    // Android Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari hint (no beforeinstallprompt on iOS)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari =
      /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("ios-install-dismissed");
    if (isIos && isSafari && !isStandalone && !dismissed) {
      setTimeout(() => setShowIosHint(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  }

  function dismissIos() {
    localStorage.setItem("ios-install-dismissed", "1");
    setShowIosHint(false);
  }

  // Android install banner
  if (prompt) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 bg-zinc-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
        <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🐾</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">アプリをインストール</p>
          <p className="text-xs text-zinc-400 mt-0.5">ホーム画面に追加してすぐ起動</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-emerald-500 rounded-xl text-xs font-semibold flex-shrink-0"
        >
          追加
        </button>
        <button onClick={() => setPrompt(null)} className="text-zinc-500 flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // iOS Safari hint
  if (showIosHint) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 bg-zinc-900 text-white rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-300">
        <button onClick={dismissIos} className="absolute top-3 right-3 text-zinc-400">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🐾</span>
          </div>
          <div>
            <p className="text-sm font-semibold">ホーム画面に追加</p>
            <p className="text-xs text-zinc-400">ネイティブアプリとして使えます</p>
          </div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-3 text-xs text-zinc-300 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">1.</span>
            <span>
              Safariの共有ボタン{" "}
              <span className="inline-block border border-zinc-600 rounded px-1">↑</span> をタップ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">2.</span>
            <span>「ホーム画面に追加」を選択</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
