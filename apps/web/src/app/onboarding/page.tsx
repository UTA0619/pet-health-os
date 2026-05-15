"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = ["ようこそ", "ペット登録", "初回記録", "完了"] as const;
type Step = 0 | 1 | 2 | 3;

const SPECIES = ["犬", "猫", "うさぎ", "鳥", "その他"];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);

  const [pet, setPet] = useState({
    name: "",
    species: "犬",
    breed: "",
    dob: "",
    weight_kg: "",
    sex: "male" as "male" | "female",
  });

  const [petId, setPetId] = useState<string | null>(null);

  async function createPet() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data, error } = await supabase
      .from("pets")
      .insert({
        owner_id: user.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed || null,
        dob: pet.dob || null,
        weight_kg: pet.weight_kg ? parseFloat(pet.weight_kg) : null,
        sex: pet.sex,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("ペットの登録に失敗しました");
    } else {
      setPetId(data.id);
      setStep(2);
    }
    setLoading(false);
  }

  async function createFirstLog() {
    setLoading(true);
    if (petId) {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("health_logs").insert({
        pet_id: petId,
        log_date: today,
        activity_level: 3,
        appetite: 3,
        stool_quality: 3,
        coat_condition: 3,
        eye_clarity: 3,
        energy_level: 3,
      });
    }
    setStep(3);
    setLoading(false);
  }

  async function finish() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500">ステップ {step + 1} / {STEPS.length}</span>
            <span className="text-sm font-medium text-zinc-700">{STEPS[step]}</span>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} />
        </div>

        {step === 0 && (
          <Card>
            <CardContent className="pt-8 pb-6 text-center">
              <div className="text-6xl mb-4">🐾</div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">Pet Health OSへようこそ！</h1>
              <p className="text-zinc-500 mb-6 leading-relaxed">
                AIがあなたのペットの健康を毎日スコアで見える化します。
                まずはペットのプロフィールを登録しましょう。
              </p>
              <div className="space-y-3 text-left mb-6">
                {["毎日の健康スコアをAIが自動計算", "写真でカメラ健康診断", "異常を早期検出してアラート"].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span className="text-sm text-zinc-700">{f}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={() => setStep(1)}>
                はじめる <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-lg font-bold text-zinc-900">ペットのプロフィール</h2>
              <div className="space-y-2">
                <Label>名前 *</Label>
                <Input
                  placeholder="例：ポチ"
                  value={pet.name}
                  onChange={(e) => setPet((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>種類 *</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPet((p) => ({ ...p, species: s }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
                        pet.species === s
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>品種（任意）</Label>
                <Input
                  placeholder="例：ゴールデンレトリバー"
                  value={pet.breed}
                  onChange={(e) => setPet((p) => ({ ...p, breed: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>生年月日（任意）</Label>
                  <Input
                    type="date"
                    value={pet.dob}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPet((p) => ({ ...p, dob: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>体重kg（任意）</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="例：5.2"
                    value={pet.weight_kg}
                    onChange={(e) => setPet((p) => ({ ...p, weight_kg: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>性別</Label>
                <div className="flex gap-3">
                  {(["male", "female"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPet((p) => ({ ...p, sex: s }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                        pet.sex === s
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200 text-zinc-600"
                      }`}
                    >
                      {s === "male" ? "オス" : "メス"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  className="flex-1"
                  onClick={createPet}
                  loading={loading}
                  disabled={!pet.name}
                >
                  登録する
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardContent className="pt-8 pb-6 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">最初の健康記録</h2>
              <p className="text-zinc-500 mb-6 leading-relaxed">
                今日の{pet.name}の状態をデフォルト値（普通）で登録します。
                後から詳細に記録できます。
              </p>
              <div className="space-y-3">
                <Button className="w-full" onClick={createFirstLog} loading={loading}>
                  今日の記録を登録してスコアを見る
                </Button>
                <Button variant="ghost" className="w-full text-zinc-500" onClick={() => setStep(3)}>
                  スキップ
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="pt-8 pb-6 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">設定完了！</h2>
              <p className="text-zinc-500 mb-6 leading-relaxed">
                {pet.name}の健康管理を始めましょう。
                毎日記録することでAIの精度が上がります。
              </p>
              <Button className="w-full" onClick={finish}>
                ダッシュボードへ <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
