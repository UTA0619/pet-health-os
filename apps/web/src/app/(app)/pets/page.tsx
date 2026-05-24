"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, RefreshCw } from "lucide-react";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  date_of_birth: string | null;
  weight_kg: number | null;
  created_at: string;
  photo_url: string | null;
};

const SPECIES_LABEL: Record<string, string> = {
  dog: "犬",
  cat: "猫",
  rabbit: "うさぎ",
  bird: "鳥",
  reptile: "爬虫類",
  other: "その他",
};

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐕",
  cat: "🐈",
  rabbit: "🐰",
  bird: "🐦",
  reptile: "🦎",
  other: "🐾",
};

export default function PetsPage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pets");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPets(data);
    } catch {
      // ignore — empty state handles it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">🐾 ペット一覧</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-40"
            aria-label="再読み込み"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button
            onClick={() => router.push("/onboarding")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 mr-1" />
            ペットを追加
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-5xl mb-4">🐾</p>
          <p className="text-lg font-semibold text-zinc-900">ペットがいません</p>
          <p className="text-sm text-zinc-500 mt-1 mb-5">最初のペットを追加しましょう</p>
          <Button
            onClick={() => router.push("/onboarding")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            ペットを追加
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pets.map((pet) => (
            <Card key={pet.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  {pet.photo_url ? (
                    <img
                      src={pet.photo_url}
                      alt={pet.name}
                      className="h-14 w-14 rounded-full object-cover border-2 border-emerald-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center flex-shrink-0 text-2xl">
                      {SPECIES_EMOJI[pet.species] ?? "🐾"}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 text-base leading-tight truncate">
                      {pet.name}
                    </p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {SPECIES_LABEL[pet.species] ?? pet.species}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      {pet.date_of_birth && (
                        <span>
                          🎂{" "}
                          {new Date(pet.date_of_birth + "T00:00:00").toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      {pet.weight_kg != null && <span>⚖️ {pet.weight_kg} kg</span>}
                    </div>
                  </div>

                  {/* Edit link */}
                  <Link
                    href={`/pets/${pet.id}/edit`}
                    className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex-shrink-0 border border-emerald-200 hover:border-emerald-300 rounded-xl px-3 py-2"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    編集
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
