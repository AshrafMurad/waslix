import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
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
    ["attention", dashboard.metrics.attentionCount],
    ["critical", dashboard.metrics.criticalCount],
    ["atRisk", dashboard.metrics.atRiskCount],
    ["overdue", dashboard.metrics.overdueCount],
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
    },
  }));
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([key, value]) => (
          <Card key={key} className="p-5">
            <p className="text-muted-foreground text-sm">
              {attentionT(`metrics.${key}`)}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {format.number(value)}
            </p>
          </Card>
        ))}
      </div>
      <Card className="gap-0 py-0">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">{attentionT("title")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
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
            <h2 className="font-semibold">{attentionT("myTasks")}</h2>
            <Link
              href="/tasks"
              className="text-brand-accent text-sm hover:underline"
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
          <h2 className="mb-4 font-semibold">
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
