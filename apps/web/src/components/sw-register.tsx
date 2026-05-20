"use client";
import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);
          // Check for updates every 60s
          setInterval(() => reg.update(), 60_000);
        })
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, []);
  return null;
}
