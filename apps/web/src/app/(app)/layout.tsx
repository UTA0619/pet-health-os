import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { PushPermissionBanner } from "@/components/push-permission";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { ConsentBanner } from "@/components/consent-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AnalyticsProvider>
      <div className="flex flex-col min-h-screen min-h-dvh">
        <main className="flex-1 overflow-y-auto pb-20">{children}</main>
        <AppNav />
        <PwaInstallPrompt />
        <PushPermissionBanner />
        <ConsentBanner />
      </div>
    </AnalyticsProvider>
  );
}
