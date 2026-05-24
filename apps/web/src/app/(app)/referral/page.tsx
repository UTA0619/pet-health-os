"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Copy, Check, Users, Share2 } from "lucide-react";

interface ReferralData {
  code: string;
  url: string;
  count: number;
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d: ReferralData) => setData(d))
      .catch(() => toast.error("招待リンクの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCopy() {
    if (!data?.url) return;
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
    toast.success("リンクをコピーしました！");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!data?.url) return;
    if (navigator.share) {
      await navigator.share({
        title: "Pet Health OS",
        text: "AIでペットの健康を管理しよう！無料で始められます 🐾",
        url: data.url,
      });
    } else {
      await handleCopy();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-6 pt-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
            <Gift className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">友達を招待する</h1>
          <p className="text-gray-500 text-sm">
            友達が有料プランに登録すると、あなたに1ヶ月分が無料になります 🎁
          </p>
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">招待した人数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "—" : (data?.count ?? 0)}
                  <span className="text-sm font-normal text-gray-500 ml-1">人</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">あなたの招待リンク</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 truncate font-mono">
                {loading ? "読み込み中..." : (data?.url ?? "—")}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                disabled={loading || !data}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleShare}
                disabled={loading || !data}
              >
                <Share2 className="w-4 h-4 mr-2" />
                シェアする
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">仕組み</p>
            <ol className="space-y-2 text-sm text-gray-600">
              {[
                "上のリンクを友達にシェアする",
                "友達がリンクから登録する",
                "友達がProプランに加入すると、あなたに1ヶ月無料が付与される",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
