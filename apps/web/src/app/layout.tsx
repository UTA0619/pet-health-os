import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Pet Health OS — AIペット健康管理",
    template: "%s | Pet Health OS",
  },
  description: "AIがあなたのペットの健康を毎日スコアで見える化。早期異常検出、カメラ健康診断で大切なペットを守ります。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pet Health OS",
    startupImage: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    title: "Pet Health OS — AIペット健康管理",
    description: "AIがあなたのペットの健康を毎日スコアで見える化します",
    siteName: "Pet Health OS",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-50 text-zinc-900">
        <I18nProvider>
          {children}
        </I18nProvider>
        <Toaster position="top-center" richColors closeButton />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
