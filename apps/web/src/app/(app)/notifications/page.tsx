"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  pet_id: string;
  pet_name: string;
  anomaly_type: string | null;
  severity: "severe" | "moderate" | "mild" | string;
  affected_metrics: string[] | null;
  detected_at: string;
  alert_sent: boolean;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  const months = Math.floor(days / 30);
  return `${months}ヶ月前`;
}

const SEVERITY_CONFIG = {
  severe: {
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: "🚨",
    label: "重大",
  },
  moderate: {
    bg: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "⚠️",
    label: "中度",
  },
  mild: {
    bg: "bg-yellow-50 border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: "💛",
    label: "軽度",
  },
} as const;

function getSeverityConfig(severity: string) {
  if (severity in SEVERITY_CONFIG) {
    return SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
  }
  return SEVERITY_CONFIG.mild;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/list");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotifications(data);
    } catch {
      // silently fail — empty state handles it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    setMarkingRead((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/notifications/read/${id}`, { method: "POST" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, alert_sent: true } : n))
        );
      }
    } finally {
      setMarkingRead((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const unreadCount = notifications.filter((n) => !n.alert_sent).length;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">🔔 通知センター</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-emerald-600 font-medium mt-0.5">
              未読 {unreadCount}件
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors disabled:opacity-50"
          aria-label="再読み込み"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          更新
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-lg font-semibold text-zinc-900">異常は検出されていません</p>
          <p className="text-sm text-zinc-500 mt-2">ペットは健康な状態です</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const cfg = getSeverityConfig(n.severity);
            const isMarking = markingRead.has(n.id);
            return (
              <div
                key={n.id}
                className={`rounded-2xl border p-4 shadow-sm transition-opacity ${cfg.bg} ${
                  n.alert_sent ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-zinc-900 text-sm">{n.pet_name}</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badge}`}
                      >
                        {cfg.label}
                      </span>
                      {n.alert_sent && (
                        <span className="text-xs text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5">
                          既読
                        </span>
                      )}
                    </div>
                    {n.anomaly_type && (
                      <p className="text-sm text-zinc-700 mt-1">{n.anomaly_type}</p>
                    )}
                    {n.affected_metrics && n.affected_metrics.length > 0 && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        異常指標: {n.affected_metrics.join("、")}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-1">{timeAgo(n.detected_at)}</p>
                  </div>
                </div>
                {!n.alert_sent && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markRead(n.id)}
                      disabled={isMarking}
                      className="text-xs h-8 px-3 border-zinc-300 text-zinc-600 hover:text-zinc-900"
                    >
                      {isMarking ? "処理中…" : "既読にする"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
