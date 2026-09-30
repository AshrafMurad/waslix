"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function CustomersError({ reset }: { reset: () => void }) {
  const t = useTranslations("customers.error");
  return (
    <div className="bg-surface border-border/80 rounded-lg border p-6 text-center shadow-xs">
      <h2 className="waslix-panel-title">{t("title")}</h2>
      <p className="waslix-panel-description">{t("description")}</p>
      <Button type="button" className="mt-4" onClick={reset}>
        {t("retry")}
      </Button>
    </div>
  );
}
