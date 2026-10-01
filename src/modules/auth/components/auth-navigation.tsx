"use client";

import { ArrowLeft, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

export function AuthNavigation() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("auth.navigation");
  const [isPending, startTransition] = useTransition();
  const nextLocale = locale === "en" ? "ar" : "en";

  function switchLocale() {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.replace(`${pathname}${window.location.search}`, {
        locale: nextLocale,
      });
    });
  }

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
        <button
          type="button"
          onClick={switchLocale}
          disabled={isPending}
          aria-busy={isPending}
          className="text-muted-foreground hover:bg-raised hover:text-foreground focus-visible:ring-ring inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
        >
          <Languages aria-hidden="true" className="size-4" />
          <span>{locale === "en" ? "العربية" : "English"}</span>
        </button>
        <ThemeToggle />
      </div>
    </nav>
  );
}
