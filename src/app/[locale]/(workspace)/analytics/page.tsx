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
import { AnalyticsColumnChart } from "@/modules/analytics/components/analytics-column-chart";
import { AnalyticsDonutChart } from "@/modules/analytics/components/analytics-donut-chart";
import { getPortfolioAnalytics } from "@/modules/analytics/queries/get-portfolio-analytics";
import { AnalyticsFilters } from "@/modules/analytics/components/analytics-filters";
import { getCustomerOptions } from "@/modules/customers/queries/get-customer-options";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function Metric({
  label,
  value,
  insight,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  insight: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "text-healthy"
      : tone === "negative"
        ? "text-risk"
        : "text-muted-foreground";

  return (
    <Card className="min-w-0 p-5">
      <CardContent className="space-y-3 p-0">
        <p className="waslix-label text-sm">{label}</p>
        <p className="waslix-data-value text-3xl">{value}</p>
        <div className="bg-border h-px" />
        <p className={`text-sm leading-6 tabular-nums ${toneClass}`}>
          {insight}
        </p>
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
  const dir = locale === "ar" ? "rtl" : "ltr";
  const numberFormat = new Intl.NumberFormat(locale);
  const percentFormat = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });
  const renewalValueChart = analytics.renewalValue.map((item) => ({
    label: item.currency,
    value: item.value,
  }));
  const healthDistributionChart = (
    ["HEALTHY", "NEEDS_ATTENTION", "AT_RISK", "UNKNOWN"] as const
  ).map((status) => ({
    label: t(`health.${status}`),
    value: analytics.healthDistribution[status],
    color:
      status === "HEALTHY"
        ? "var(--healthy)"
        : status === "NEEDS_ATTENTION"
          ? "var(--attention)"
          : status === "AT_RISK"
            ? "var(--risk)"
            : "var(--muted-foreground)",
  }));
  const riskSeverityChart = (
    ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const
  ).map((severity) => ({
    label: t(`risks.${severity}`),
    value: analytics.riskSeverity[severity] ?? 0,
  }));
  const ownerWorkloadChart = analytics.ownerWorkload
    .slice(0, 8)
    .map((owner) => ({
      label: owner.ownerName,
      value: owner.customers + owner.tasks + owner.risks,
    }));

  return (
    <div className="waslix-page">
      <div className="waslix-page-header lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="waslix-eyebrow">{t("eyebrow")}</p>
          <h1 className="waslix-page-title">{t("title")}</h1>
          <p className="waslix-page-description">{t("description")}</p>
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
          insight={t("metrics.customerGrowth", {
            current: analytics.customerGrowthCurrent,
            previous: analytics.customerGrowthPrevious,
            delta: signed(analytics.customerGrowth),
          })}
          tone={
            analytics.customerGrowth > 0
              ? "positive"
              : analytics.customerGrowth < 0
                ? "negative"
                : "neutral"
          }
        />
        <Metric
          label={t("metrics.averageHealth")}
          value={analytics.averageHealth ?? t("na")}
          insight={
            analytics.trend == null
              ? t("metrics.noTrend")
              : t("metrics.healthTrend", { delta: signed(analytics.trend) })
          }
          tone={
            analytics.trend == null || analytics.trend === 0
              ? "neutral"
              : analytics.trend > 0
                ? "positive"
                : "negative"
          }
        />
        <Metric
          label={t("metrics.trend")}
          value={
            analytics.trend == null
              ? t("na")
              : `${analytics.trend > 0 ? "+" : ""}${analytics.trend}`
          }
          insight={t("metrics.trendCoverage", analytics.trendCoverage)}
          tone={
            analytics.trend == null || analytics.trend === 0
              ? "neutral"
              : analytics.trend > 0
                ? "positive"
                : "negative"
          }
        />
        <Metric
          label={t("metrics.renewalOutcome")}
          value={
            analytics.renewalOutcomeRate == null
              ? t("na")
              : `${analytics.renewalOutcomeRate}%`
          }
          insight={
            analytics.renewalOutcomeDelta == null
              ? t("metrics.noRenewalDelta")
              : t("metrics.renewalDelta", {
                  delta: signed(analytics.renewalOutcomeDelta),
                })
          }
          tone={
            analytics.renewalOutcomeDelta == null ||
            analytics.renewalOutcomeDelta === 0
              ? "neutral"
              : analytics.renewalOutcomeDelta > 0
                ? "positive"
                : "negative"
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>{t("health.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnalyticsDonutChart
              data={healthDistributionChart}
              locale={locale}
            />
            <p className="text-muted-foreground text-sm">
              {t("health.coverage", analytics.healthCoverage)}
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>{t("risks.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnalyticsColumnChart dir={dir} data={riskSeverityChart} />
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>{t("renewals.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.renewalValue.length ? (
              <>
                <AnalyticsBarChart
                  dir={dir}
                  data={renewalValueChart}
                  locale={locale}
                  valueFormat="number"
                />
                <div className="grid gap-2 text-sm">
                  {analytics.renewalValue.map((item) => (
                    <div
                      key={item.currency}
                      className="flex items-center justify-between gap-3"
                    >
                      <span>{item.currency}</span>
                      <span className="font-medium tabular-nums">
                        {numberFormat.format(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("renewals.empty")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>{t("onboarding.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold tabular-nums">
              {analytics.onboarding.total
                ? `${percentFormat.format(Math.round((analytics.onboarding.completed / analytics.onboarding.total) * 100))}%`
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

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>{t("lifecycle.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsDonutChart
              data={analytics.lifecycleDistribution}
              locale={locale}
            />
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>{t("capacity.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnalyticsBarChart
              dir={dir}
              data={ownerWorkloadChart}
              height="sm"
            />
            <p className="text-muted-foreground text-sm">
              {t("capacity.description")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t("workload.title")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-0">
          <Table className="min-w-2xl" dir={dir}>
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
