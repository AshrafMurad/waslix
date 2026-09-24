"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function CustomersError({ reset }: { reset: () => void }) {
  const t = useTranslations("customers.error");
  return (
    <div className="bg-surface rounded-md border p-6 text-center">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground mt-2">{t("description")}</p>
      <Button type="button" className="mt-4" onClick={reset}>
        {t("retry")}
      </Button>
    </div>
  );
}
