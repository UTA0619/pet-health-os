"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  date_of_birth: string | null;
  weight_kg: number | null;
  notes: string | null;
};

const SPECIES_OPTIONS = [
  { value: "dog", label: "犬" },
  { value: "cat", label: "猫" },
  { value: "rabbit", label: "うさぎ" },
  { value: "bird", label: "鳥" },
  { value: "reptile", label: "爬虫類" },
  { value: "other", label: "その他" },
];

export default function PetEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pets");
      if (!res.ok) throw new Error("取得に失敗しました");
      const pets: Pet[] = await res.json();
      const found = pets.find((p) => p.id === id);
      if (!found) {
        setError("ペットが見つかりません");
        return;
      }
      setPet(found);
      setName(found.name);
      setSpecies(found.species);
      setBreed(found.breed ?? "");
      setDateOfBirth(found.date_of_birth ?? "");
      setWeightKg(found.weight_kg != null ? String(found.weight_kg) : "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!name.trim()) {
      setError("名前を入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/pets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          breed: breed.trim() || null,
          date_of_birth: dateOfBirth || null,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "保存に失敗しました");
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`「${pet?.name}」を削除しますか？この操作は元に戻せません。`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/pets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "削除に失敗しました");
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-40 bg-zinc-100 rounded animate-pulse" />
        <div className="h-64 bg-zinc-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error && !pet) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-zinc-500">{error}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-emerald-600 font-medium text-sm"
        >
          ダッシュボードに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-600"
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-zinc-900">ペット情報の編集</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-5 space-y-5">
          {/* 名前 */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-zinc-700">
              名前 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：ポチ"
              className="border-zinc-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
          </div>

          {/* 種類 */}
          <div className="space-y-1.5">
            <Label htmlFor="species" className="text-sm font-medium text-zinc-700">
              種類
            </Label>
            <select
              id="species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {SPECIES_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 品種 */}
          <div className="space-y-1.5">
            <Label htmlFor="breed" className="text-sm font-medium text-zinc-700">
              品種
            </Label>
            <Input
              id="breed"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="例：柴犬"
              className="border-zinc-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
          </div>

          {/* 生年月日 */}
          <div className="space-y-1.5">
            <Label htmlFor="dob" className="text-sm font-medium text-zinc-700">
              生年月日
            </Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="border-zinc-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
          </div>

          {/* 体重 */}
          <div className="space-y-1.5">
            <Label htmlFor="weight" className="text-sm font-medium text-zinc-700">
              体重 (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              min="0"
              max="500"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="例：5.2"
              className="border-zinc-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving || deleting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-12"
      >
        {saving ? "保存中…" : "保存する"}
      </Button>

      {/* Delete */}
      <Button
        variant="outline"
        onClick={handleDelete}
        disabled={saving || deleting}
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl h-12"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {deleting ? "削除中…" : "このペットを削除する"}
      </Button>
    </div>
  );
}
