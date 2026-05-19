import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string"
    ? new Date(date + (date.length === 10 ? "T00:00:00" : ""))  // treat YYYY-MM-DD as local time
    : date;
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export function scoreToColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

export function scoreToGradient(score: number): string {
  if (score >= 80) return "from-emerald-400 to-emerald-600";
  if (score >= 60) return "from-yellow-400 to-yellow-600";
  if (score >= 40) return "from-orange-400 to-orange-600";
  return "from-red-400 to-red-600";
}

export function metricLabel(value: number): string {
  const labels: Record<number, string> = {
    1: "😫 とても悪い",
    2: "😟 悪い",
    3: "😐 普通",
    4: "😊 良い",
    5: "🌟 とても良い",
  };
  return labels[value] ?? "—";
}
