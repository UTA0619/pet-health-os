"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, RotateCcw, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { DISCLAIMER } from "@/lib/ai/health-score";

type AnalysisResult = {
  coat_condition: string;
  eye_clarity: string;
  posture: string;
  mobility: string;
  visible_concerns: string[];
  confidence: number;
  recommendations: string[];
  requires_vet_attention: boolean;
};

export default function CameraPage() {
  const supabase = createBrowserClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [petId, setPetId] = useState<string | null>(null);
  const [petName, setPetName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    async function loadPet() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("pets")
        .select("id, name")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();
      if (data) { setPetId(data.id); setPetName(data.name); }
    }
    loadPet();
  }, [supabase]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      toast.error("ファイルサイズは20MB以下にしてください");
      return;
    }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  async function handleAnalyze() {
    if (!file || !petId) return;
    setUploading(true);

    try {
      const { data: urlData, error: urlError } = await supabase.functions.invoke("analyze-pet-image", {
        body: { pet_id: petId, file_name: file.name, content_type: file.type },
      });

      if (urlError) throw urlError;

      if (urlData?.upload_url) {
        await fetch(urlData.upload_url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
      }

      const analysis = urlData?.analysis as AnalysisResult;
      if (analysis) {
        setResult(analysis);
        if (analysis.requires_vet_attention) {
          toast.warning("獣医師への相談が推奨されます", { duration: 6000 });
        } else {
          toast.success("分析完了！");
        }
      }
    } catch {
      toast.error("分析に失敗しました。もう一度お試しください。");
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setPreview(null);
    setFile(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">AIカメラスキャン</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {petName ? `${petName}` : "ペット"}の写真を撮影してAIが健康チェック
        </p>
      </div>

      {!preview ? (
        <Card>
          <CardContent className="pt-6">
            <label className="flex flex-col items-center justify-center gap-4 py-12 cursor-pointer rounded-xl border-2 border-dashed border-zinc-200 hover:border-emerald-400 transition-colors">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <Camera className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-700">写真を選択またはカメラで撮影</p>
                <p className="text-xs text-zinc-400 mt-1">JPG, PNG, WEBP（最大20MB）</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.removeAttribute("capture");
                    fileRef.current.click();
                  }
                }}
              >
                <Upload className="h-4 w-4" />
                ライブラリから選択
              </Button>
              <Button
                className="flex-1"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                カメラで撮影
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900">
            <img src={preview} alt="Preview" className="w-full object-contain max-h-72" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
                <p className="text-white text-sm font-medium">AIが分析中...</p>
              </div>
            )}
          </div>

          {!result && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} disabled={uploading}>
                <RotateCcw className="h-4 w-4" />
                やり直す
              </Button>
              <Button className="flex-1" onClick={handleAnalyze} loading={uploading}>
                この写真で分析する
              </Button>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <Card className={result.requires_vet_attention ? "border-red-200" : "border-emerald-200"}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                {result.requires_vet_attention ? (
                  <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-zinc-900">
                    {result.requires_vet_attention ? "獣医師への相談を推奨" : "異常は検出されませんでした"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    信頼度: {Math.round(result.confidence * 100)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "被毛の状態", value: result.coat_condition },
                  { label: "目の状態", value: result.eye_clarity },
                  { label: "姿勢", value: result.posture },
                  { label: "動き", value: result.mobility },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-zinc-50 rounded-xl">
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <p className="text-sm font-medium text-zinc-900">{value}</p>
                  </div>
                ))}
              </div>

              {result.visible_concerns.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-zinc-700 mb-2">気になる点</p>
                  <div className="flex flex-wrap gap-2">
                    {result.visible_concerns.map((c, i) => (
                      <Badge key={i} variant="warning">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-zinc-700 mb-2">アドバイス</p>
                  <ul className="space-y-1">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                        <span className="text-emerald-500 flex-shrink-0 mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={reset}>
            <Camera className="h-4 w-4" />
            別の写真をスキャンする
          </Button>

          <p className="text-xs text-zinc-400 leading-relaxed">{DISCLAIMER}</p>
        </div>
      )}
    </div>
  );
}
