import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { AttentionQueue } from "@/modules/attention/components/attention-queue";
import { getOverviewDashboard } from "@/modules/attention/queries/get-overview-dashboard";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const access = await requireProtectedPage(locale);
  const [dashboard, t, attentionT, format] = await Promise.all([
    getOverviewDashboard(access),
    getTranslations({ locale, namespace: "shell.overview" }),
    getTranslations({ locale, namespace: "attention" }),
    getFormatter({ locale }),
  ]);
  const metrics = [
    [
      "attention",
      dashboard.metrics.attentionCount,
      dashboard.metricBaselines.attentionCount,
    ],
    [
      "critical",
      dashboard.metrics.criticalCount,
      dashboard.metricBaselines.criticalCount,
    ],
    [
      "atRisk",
      dashboard.metrics.atRiskCount,
      dashboard.metricBaselines.atRiskCount,
    ],
    [
      "overdue",
      dashboard.metrics.overdueCount,
      dashboard.metricBaselines.overdueCount,
    ],
  ] as const;
  const items = dashboard.items.map((item) => ({
    id: item.id,
    priority: item.priority,
    status: item.status,
    reasonKeys: item.reasonSummary.split(",").filter(Boolean),
    healthDelta: item.healthDelta,
    customer: {
      id: item.customer.id,
      name: item.customer.name,
      renewalDate: item.customer.renewalDate
        ? format.dateTime(item.customer.renewalDate, { dateStyle: "medium" })
        : null,
      ownerName: item.customer.owner.user.name,
      healthScore: item.customer.currentHealth?.overallScore ?? null,
      recommendations: item.customer.recommendations,
    },
  }));
  return (
    <div className="waslix-page">
      <div className="space-y-1">
        <p className="waslix-eyebrow">{t("eyebrow")}</p>
        <h1 className="waslix-page-title">{t("title")}</h1>
        <p className="waslix-page-description max-w-2xl">{t("description")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([key, value, baseline]) => {
          const delta = value - baseline;
          const trend =
            delta > 0 ? "increase" : delta < 0 ? "decrease" : "constant";
          const trendClass =
            trend === "increase"
              ? "text-risk"
              : trend === "decrease"
                ? "text-healthy"
                : "text-muted-foreground";
          const trendPanelClass =
            trend === "increase"
              ? "border-risk/20 bg-risk/5"
              : trend === "decrease"
                ? "border-healthy/20 bg-healthy/5"
                : "border-border bg-raised/40";
          const TrendIcon =
            trend === "increase"
              ? TrendingUpIcon
              : trend === "decrease"
                ? TrendingDownIcon
                : MinusIcon;
          return (
            <Card key={key} className="gap-4 overflow-hidden py-0">
              <CardHeader className="px-5 pt-5 pb-0">
                <p className="text-muted-foreground text-sm font-medium">
                  {attentionT(`metrics.${key}`)}
                </p>
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-4 px-5 pb-5">
                <p className="text-3xl leading-none font-semibold tabular-nums md:text-4xl">
                  {format.number(value)}
                </p>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium tabular-nums ${trendClass} ${trendPanelClass}`}
                >
                  <TrendIcon className="size-3.5" aria-hidden="true" />
                  {attentionT(`metricsTrend.${trend}`, {
                    count: format.number(Math.abs(delta)),
                  })}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="gap-0 py-0">
        <div className="waslix-panel-header">
          <h2 className="waslix-panel-title">{attentionT("title")}</h2>
          <p className="waslix-panel-description">
            {attentionT("description")}
          </p>
        </div>
        <AttentionQueue
          items={items}
          locale={locale}
          canAct={access.role !== "VIEWER"}
        />
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="waslix-panel-title">{attentionT("myTasks")}</h2>
            <Link
              href="/tasks"
              className="text-brand-accent text-sm font-medium hover:underline"
            >
              {attentionT("viewAll")}
            </Link>
          </div>
          {dashboard.tasks.length ? (
            <ul className="divide-y">
              {dashboard.tasks.map((task) => (
                <li key={task.id} className="py-3">
                  <p className="font-medium" dir="auto">
                    {task.title}
                  </p>
                  <p className="text-muted-foreground text-xs" dir="auto">
                    {task.customer?.name ?? attentionT("noCustomer")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              {attentionT("tasksEmpty")}
            </p>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="waslix-panel-title mb-4">
            {attentionT("portfolioHealth")}
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {(["HEALTHY", "NEEDS_ATTENTION", "AT_RISK"] as const).map(
              (status) => (
                <div key={status} className="bg-raised rounded-md p-3">
                  <p className="text-2xl font-semibold tabular-nums">
                    {format.number(Number(dashboard.healthGroups[status] ?? 0))}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {attentionT(`healthStatus.${status}`)}
                  </p>
                </div>
              ),
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
