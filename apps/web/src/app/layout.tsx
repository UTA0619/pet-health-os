import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Pet Health OS — AI-Powered Pet Health Monitoring",
  description: "Predictive health intelligence for your pet. Catch illness early with daily health scoring, camera analysis, and anomaly detection.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-50 text-zinc-900 font-[var(--font-geist)]">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
