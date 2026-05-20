"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-6 text-center">
      <div className="text-6xl mb-4">🐾</div>
      <h1 className="text-xl font-bold text-zinc-900 mb-2">オフラインです</h1>
      <p className="text-sm text-zinc-500 mb-6">
        インターネット接続を確認してください。<br />
        以前に見たページはオフラインでも閲覧できます。
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium text-sm"
      >
        再試行
      </button>
    </div>
  );
}
