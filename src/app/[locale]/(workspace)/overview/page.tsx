import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { isLocale } from "@/i18n/config";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "shell.overview" });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-brand-accent text-xs font-medium tracking-wide uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          {t("description")}
        </p>
      </div>
      <Card>
        <Empty className="min-h-64">
          <span className="bg-raised text-brand-accent mx-auto flex size-12 items-center justify-center rounded-md">
            <LayoutDashboard aria-hidden="true" className="size-5" />
          </span>
          <EmptyTitle className="mt-2">{t("emptyTitle")}</EmptyTitle>
          <EmptyDescription className="leading-6">
            {t("emptyDescription")}
          </EmptyDescription>
        </Empty>
      </Card>
    </div>
  );
}
