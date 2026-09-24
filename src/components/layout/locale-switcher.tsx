"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { updateLocaleAction } from "@/modules/workspace/actions/update-locale";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("shell.controls");
  const [hasError, setHasError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const nextLocale = locale === "en" ? "ar" : "en";

  function switchLocale() {
    setHasError(false);
    startTransition(async () => {
      try {
        const result = await updateLocaleAction({ locale: nextLocale });
        if (!result.ok) {
          setHasError(true);
          return;
        }

        router.replace(`${pathname}${window.location.search}`, {
          locale: nextLocale,
        });
        router.refresh();
      } catch {
        setHasError(true);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={switchLocale}
        disabled={isPending}
        className="text-muted-foreground hover:bg-raised hover:text-foreground flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors disabled:opacity-50"
        aria-label={t("language")}
        aria-busy={isPending}
      >
        <Languages aria-hidden="true" className="size-4" />
        <span>{t("languageOption")}</span>
      </button>
      {hasError ? (
        <span role="alert" className="sr-only">
          {t("languageError")}
        </span>
      ) : null}
    </div>
  );
}
