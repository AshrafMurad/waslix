"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function LocaleError({ reset }: { reset: () => void }) {
  const t = useTranslations("common.error");

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center p-6 text-center">
      <section className="bg-surface border-border/80 w-full max-w-md rounded-lg border p-6 shadow-xs">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-3">{t("description")}</p>
        <Button type="button" className="mt-6" onClick={reset}>
          {t("retry")}
        </Button>
      </section>
    </main>
  );
}
