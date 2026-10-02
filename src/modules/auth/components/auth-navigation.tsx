"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Link } from "@/i18n/navigation";

export function AuthNavigation() {
  const t = useTranslations("auth.navigation");

  return (
    <nav
      aria-label={t("label")}
      className="mx-auto mb-4 flex w-full max-w-6xl items-center justify-between gap-3"
    >
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-medium outline-none focus-visible:ring-2"
      >
        <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
        {t("home")}
      </Link>
      <div className="flex items-center gap-1">
        <LocaleSwitcher variant="marketing" persistPreference={false} />
        <ThemeToggle variant="marketing" />
      </div>
    </nav>
  );
}
