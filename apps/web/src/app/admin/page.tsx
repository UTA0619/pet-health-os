import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, AlertTriangle, Activity, CreditCard } from "lucide-react";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    redirect("/dashboard");
  }
  return user;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const service = createServiceClient();

  // Fetch stats in parallel
  const [
    { count: userCount },
    { count: petCount },
    { count: anomalyCount },
    { count: proCount },
  ] = await Promise.all([
    service.from("profiles").select("*", { count: "exact", head: true }),
    service.from("pets").select("*", { count: "exact", head: true }).eq("is_active", true),
    service
      .from("anomaly_detections")
      .select("*", { count: "exact", head: true })
      .is("resolved_at", null),
    service
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  // Recent anomaly alerts
  const { data: recentAnomalies } = await service
    .from("anomaly_detections")
    .select(
      "id, detected_at, anomaly_type, severity, confidence, pets(name, species)"
    )
    .is("resolved_at", null)
    .order("detected_at", { ascending: false })
    .limit(10);

  // Recent signups
  const { data: recentUsers } = await service
    .from("profiles")
    .select("id, email, created_at, subscription_tier")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-xs text-gray-500">Pet Health OS — Internal Operations</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            ← アプリに戻る
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="総ユーザー数"
            value={userCount ?? 0}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            color="bg-blue-100"
          />
          <StatCard
            label="登録ペット数"
            value={petCount ?? 0}
            icon={<Activity className="w-5 h-5 text-emerald-600" />}
            color="bg-emerald-100"
          />
          <StatCard
            label="未解決アラート"
            value={anomalyCount ?? 0}
            icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
            color="bg-orange-100"
          />
          <StatCard
            label="有料ユーザー"
            value={proCount ?? 0}
            icon={<CreditCard className="w-5 h-5 text-purple-600" />}
            color="bg-purple-100"
          />
        </div>

        {/* Recent Anomaly Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">未解決の異常アラート</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentAnomalies ?? []).length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">
                未解決のアラートはありません 🎉
              </p>
            ) : (
              (recentAnomalies ?? []).map((a) => {
                const pet = Array.isArray(a.pets) ? a.pets[0] : a.pets;
                const severityColor =
                  a.severity === "SEVERE"
                    ? "bg-red-100 text-red-700"
                    : a.severity === "MODERATE"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-yellow-100 text-yellow-700";
                return (
                  <div key={a.id} className="px-5 py-3 flex items-center gap-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityColor}`}>
                      {a.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pet?.name ?? "Unknown"} — {a.anomaly_type}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(a.detected_at).toLocaleString("ja-JP")} · 信頼度{" "}
                        {Math.round((a.confidence ?? 0) * 100)}%
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Sign-ups */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">直近の登録ユーザー</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentUsers ?? []).map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.email}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.subscription_tier === "pro"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {u.subscription_tier ?? "free"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
