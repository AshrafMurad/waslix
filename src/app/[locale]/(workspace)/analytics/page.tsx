import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isLocale } from "@/i18n/config";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { AnalyticsBarChart } from "@/modules/analytics/components/analytics-bar-chart";
import { getPortfolioAnalytics } from "@/modules/analytics/queries/get-portfolio-analytics";
import { AnalyticsFilters } from "@/modules/analytics/components/analytics-filters";
import { getCustomerOptions } from "@/modules/customers/queries/get-customer-options";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <CardContent className="space-y-2 p-0">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const access = await requireProtectedPage(locale);
  const raw = await searchParams;
  const filters = {
    period: first(raw.period),
    owner: first(raw.owner),
    lifecycle: first(raw.lifecycle),
  };
  const [analytics, options, t] = await Promise.all([
    getPortfolioAnalytics(access, filters),
    getCustomerOptions(access),
    getTranslations({ locale, namespace: "analytics" }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-brand-accent text-xs font-medium tracking-wide uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-3xl">{t("description")}</p>
        </div>
        <AnalyticsFilters
          filters={analytics.filters}
          owners={options.owners.map((owner) => ({
            id: owner.id,
            name: owner.user.name,
          }))}
          lifecycleStages={options.lifecycleStages}
          labels={{
            period: t("filters.period"),
            owner: t("filters.owner"),
            lifecycle: t("filters.lifecycle"),
            all: t("filters.all"),
            days30: t("filters.days30"),
            days90: t("filters.days90"),
            days180: t("filters.days180"),
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={t("metrics.customers")}
          value={analytics.customerCount}
        />
        <Metric
          label={t("metrics.averageHealth")}
          value={analytics.averageHealth ?? t("na")}
        />
        <Metric
          label={t("metrics.trend")}
          value={
            analytics.trend == null
              ? t("na")
              : `${analytics.trend > 0 ? "+" : ""}${analytics.trend}`
          }
        />
        <Metric
          label={t("metrics.renewalOutcome")}
          value={
            analytics.renewalOutcomeRate == null
              ? t("na")
              : `${analytics.renewalOutcomeRate}%`
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("health.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnalyticsBarChart
              data={(
                ["HEALTHY", "NEEDS_ATTENTION", "AT_RISK", "UNKNOWN"] as const
              ).map((status) => ({
                label: t(`health.${status}`),
                value: analytics.healthDistribution[status],
              }))}
            />
            <p className="text-muted-foreground text-sm">
              {t("health.coverage", analytics.healthCoverage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("risks.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnalyticsBarChart
              data={(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(
                (severity) => ({
                  label: t(`risks.${severity}`),
                  value: analytics.riskSeverity[severity] ?? 0,
                }),
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("renewals.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.renewalValue.length ? (
              analytics.renewalValue.map((item) => (
                <div
                  key={item.currency}
                  className="flex items-center justify-between gap-3"
                >
                  <span>{item.currency}</span>
                  <span className="font-medium tabular-nums">
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: item.currency,
                    }).format(item.value)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("renewals.empty")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("onboarding.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold tabular-nums">
              {analytics.onboarding.total
                ? `${Math.round((analytics.onboarding.completed / analytics.onboarding.total) * 100)}%`
                : t("na")}
            </p>
            <p className="text-muted-foreground text-sm">
              {t("onboarding.summary", {
                ...analytics.onboarding,
                medianCompletionDays:
                  analytics.onboarding.medianCompletionDays ?? t("na"),
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("workload.title")}</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table className="min-w-2xl" dir={locale === "ar" ? "rtl" : "ltr"}>
            <TableHeader>
              <TableRow className="bg-raised hover:bg-raised">
                <TableHead className="px-6">{t("workload.owner")}</TableHead>
                <TableHead className="px-4">
                  {t("workload.customers")}
                </TableHead>
                <TableHead className="px-4">{t("workload.tasks")}</TableHead>
                <TableHead className="px-4">{t("workload.risks")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.ownerWorkload.map((owner) => (
                <TableRow key={owner.ownerId}>
                  <TableCell className="px-6 py-3" dir="auto">
                    {owner.ownerName}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {owner.customers}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {owner.tasks}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {owner.risks}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
