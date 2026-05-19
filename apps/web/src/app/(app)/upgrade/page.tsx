"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, ArrowLeft, Shield, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FREE_FEATURES = [
  "1匹のペット",
  "7日間の記録",
  "基本ヘルススコア",
  "カメラスキャン（1日3回まで）",
];

const PRO_FEATURES = [
  { icon: "🐾", text: "複数ペット対応（最大10匹）" },
  { icon: "📊", text: "90日間の健康履歴＆トレンド分析" },
  { icon: "🤖", text: "AIカメラスキャン（無制限）" },
  { icon: "🚨", text: "異常検知アラート（48〜72時間前に察知）" },
  { icon: "📧", text: "毎日のAIヘルスレポートメール" },
  { icon: "📄", text: "PDF健康レポート（獣医に共有）" },
  { icon: "💬", text: "優先サポート" },
];

const PRO_NOT_IN_FREE = [
  "複数ペット対応（最大10匹）",
  "90日間の健康履歴＆トレンド分析",
  "AIカメラスキャン（無制限）",
  "異常検知アラート",
  "AIヘルスレポートメール",
  "PDF健康レポート",
  "優先サポート",
];

const FAQS = [
  {
    q: "14日間の無料トライアルとは？",
    a: "クレジットカードを登録するだけで、14日間すべてのPro機能を無料でお試しいただけます。トライアル期間中はいつでもキャンセル可能で、料金は一切発生しません。",
  },
  {
    q: "いつでもキャンセルできますか？",
    a: "はい、いつでもキャンセル可能です。キャンセルしても現在の請求期間の終わりまでProプランをご利用いただけます。",
  },
  {
    q: "年額プランはどのくらいお得ですか？",
    a: "月額プランと比較して約33%お得です。年額¥7,800は月々換算で約¥650となり、月額¥980より大幅に割安です。",
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: annual ? "pro_yearly" : "pro_monthly" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "チェックアウトに失敗しました");
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URLが返されませんでした");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        戻る
      </button>

      {/* Hero header */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-6 text-white text-center shadow-lg">
        <div className="flex justify-center mb-3">
          <div className="bg-white/20 rounded-full p-3">
            <Zap className="h-7 w-7 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-black mb-1">Proプランにアップグレード</h1>
        <p className="text-sm text-emerald-100">
          あなたのペットに最高のAIヘルスケアを
        </p>

        {/* Billing toggle */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!annual ? "text-white" : "text-emerald-200"}`}>
            月額
          </span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              annual ? "bg-white/30" : "bg-white/20"
            }`}
            style={{ width: "3.25rem" }}
            role="switch"
            aria-checked={annual}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg transform transition duration-200 ${
                annual ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? "text-white" : "text-emerald-200"}`}>
            年額
          </span>
          {annual && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
              33% OFF
            </span>
          )}
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Free */}
        <Card className="border-zinc-200">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">無料</p>
            <p className="text-3xl font-black text-zinc-900">¥0</p>
            <p className="text-xs text-zinc-400 mt-0.5">ずっと無料</p>
            <div className="mt-4 space-y-2">
              {FREE_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-600 leading-tight">{f}</span>
                </div>
              ))}
              {PRO_NOT_IN_FREE.map((f) => (
                <div key={f} className="flex items-start gap-1.5">
                  <X className="h-3.5 w-3.5 text-zinc-300 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-300 leading-tight line-through">{f}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-2 border-emerald-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl flex items-center gap-1">
            <Star className="h-2.5 w-2.5" /> PRO
          </div>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Pro</p>
            {annual ? (
              <>
                <p className="text-3xl font-black text-zinc-900">¥7,800</p>
                <p className="text-xs text-zinc-400 mt-0.5">年額（¥650/月）</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-black text-zinc-900">¥980</p>
                <p className="text-xs text-zinc-400 mt-0.5">月額</p>
              </>
            )}
            <div className="mt-4 space-y-2">
              {FREE_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-700 leading-tight">{f}</span>
                </div>
              ))}
              {PRO_NOT_IN_FREE.map((f) => (
                <div key={f} className="flex items-start gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-700 leading-tight">{f}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pro benefits detail */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-3">
          <h2 className="font-bold text-zinc-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-500" />
            Proプランの特典
          </h2>
          {PRO_FEATURES.map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="text-lg leading-none flex-shrink-0">{icon}</span>
              <span className="text-sm text-zinc-700 leading-snug">{text}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full text-base font-bold"
          onClick={handleCheckout}
          loading={loading}
        >
          {annual ? "年額プランで始める — ¥7,800/年" : "月額プランで始める — ¥980/月"}
        </Button>

        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <span>14日間無料トライアル</span>
            <span className="text-zinc-300">·</span>
            <span>クレジットカード必要</span>
            <span className="text-zinc-300">·</span>
            <span>いつでもキャンセル</span>
          </div>
          <p className="text-xs text-zinc-400">
            トライアル期間中は料金が発生しません
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="font-bold text-zinc-900">よくある質問</h2>
        {FAQS.map(({ q, a }) => (
          <Card key={q}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold text-zinc-900 mb-1.5">{q}</p>
              <p className="text-sm text-zinc-500 leading-relaxed">{a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
