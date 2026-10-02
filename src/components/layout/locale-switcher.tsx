"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { updateLocaleAction } from "@/modules/workspace/actions/update-locale";

type LocaleSwitcherProps = {
  variant?: "shell" | "marketing";
  persistPreference?: boolean;
  className?: string;
  onSwitched?: () => void;
};

export function LocaleSwitcher({
  variant = "shell",
  persistPreference = true,
  className,
  onSwitched,
}: LocaleSwitcherProps) {
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
        if (persistPreference) {
          const result = await updateLocaleAction({ locale: nextLocale });
          if (!result.ok) {
            setHasError(true);
            return;
          }
        } else {
          document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
        }

        router.replace(`${pathname}${window.location.search}`, {
          locale: nextLocale,
        });
        router.refresh();
        onSwitched?.();
      } catch {
        setHasError(true);
      }
    });
  }

  return (
    <div>
      {variant === "marketing" ? (
        <button
          type="button"
          onClick={switchLocale}
          disabled={isPending}
          className={cn("marketing-language-switch", className)}
          aria-label={t("language")}
          aria-busy={isPending}
          title={t("language")}
        >
          <Languages aria-hidden="true" />
          <span>{locale.toUpperCase()}</span>
          <i aria-hidden="true" />
          <span>{nextLocale.toUpperCase()}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={switchLocale}
          disabled={isPending}
          className={cn(
            "text-muted-foreground hover:bg-raised hover:text-foreground flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors disabled:opacity-50",
            className,
          )}
          aria-label={t("language")}
          aria-busy={isPending}
        >
          <Languages aria-hidden="true" className="size-4" />
          <span>{t("languageOption")}</span>
        </button>
      )}
      {hasError ? (
        <span role="alert" className="sr-only">
          {t("languageError")}
        </span>
      ) : null}
    </div>
  );
}
