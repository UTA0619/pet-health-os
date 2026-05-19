"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function UpgradeToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("upgraded") === "1") {
      toast.success("🎉 Proプランへようこそ！14日間の無料トライアルが始まりました");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  return null;
}
