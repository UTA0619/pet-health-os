"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, Camera, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function AppNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: "/dashboard", icon: Home, label: t.nav.home },
    { href: "/log", icon: PlusSquare, label: t.nav.log },
    { href: "/camera", icon: Camera, label: t.nav.camera },
    { href: "/settings", icon: Settings, label: t.nav.settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-zinc-200 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px] py-2 rounded-xl transition-colors",
                active ? "text-emerald-600" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
