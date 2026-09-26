import { randomUUID } from "node:crypto";

import { getTranslations } from "next-intl/server";

import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

import type { getHealthOverview } from "../queries/get-health-overview";
import { HealthInputForm } from "./health-input-form";

type HealthOverviewData = NonNullable<
  Awaited<ReturnType<typeof getHealthOverview>>
>;

export async function HealthOverview({
  customerId,
  locale,
  data,
  activeWindow,
  canEdit,
}: {
  customerId: string;
  locale: string;
  data: HealthOverviewData;
  activeWindow: 7 | 30 | 90;
  canEdit: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "health" });
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent" });
  const dateTime = new Intl.DateTimeFormat(locale, {
    calendar: "gregory",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const current = data.current;
  const comparison = data.comparisons[activeWindow];
  const dimensions = ["USAGE", "ENGAGEMENT", "SUPPORT", "GOALS"] as const;
  const inputByDimension = new Map(
    data.inputs.map((input) => [input.dimension, input]),
  );
  const statusTone =
    current?.status === "HEALTHY"
      ? "text-healthy"
      : current?.status === "AT_RISK"
        ? "text-risk"
        : current?.status === "NEEDS_ATTENTION"
          ? "text-attention"
          : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card className="p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm">{t("overall")}</p>
              {current?.overallScore !== null &&
              current?.overallScore !== undefined &&
              current.status ? (
                <div className="mt-1 flex items-baseline gap-3">
                  <span
                    className={`text-4xl font-semibold tabular-nums ${statusTone}`}
                  >
                    {number.format(current.overallScore)}
                  </span>
                  <span className={`font-medium ${statusTone}`}>
                    {t(`status.${current.status}`)}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-xl font-medium">{t("unknown")}</p>
              )}
            </div>
            <nav
              aria-label={t("comparison.label")}
              className="flex gap-1 rounded-md border p-1"
            >
              {([7, 30, 90] as const).map((window) => (
                <Link
                  key={window}
                  href={`/customers/${customerId}/health?window=${window}`}
                  className={
                    activeWindow === window
                      ? "bg-raised rounded-md px-3 py-2 text-sm font-medium"
                      : "text-muted-foreground rounded-md px-3 py-2 text-sm"
                  }
                >
                  {t("comparison.days", { count: window })}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-sm">
            <span>
              {comparison
                ? t(`comparison.${comparison.direction}`, {
                    delta: number.format(Math.abs(comparison.delta)),
                    days: activeWindow,
                  })
                : t("comparison.unavailable", { days: activeWindow })}
            </span>
            <span>
              {t("confidence", {
                level: current
                  ? t(`confidenceLevel.${current.confidence}`)
                  : t("confidenceLevel.LOW"),
                coverage: percent.format(current?.confidenceValue ?? 0),
              })}
            </span>
            <span className="text-muted-foreground">
              {current
                ? t("calculatedAt", {
                    value: dateTime.format(current.calculatedAt),
                  })
                : t("neverCalculated")}
            </span>
            {data.pending ? (
              <span className="text-information" role="status">
                {t("pending")}
              </span>
            ) : null}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">{t("explanation.title")}</h2>
          {data.reasons.length ? (
            <ul className="mt-3 space-y-2">
              {data.reasons.map((reason) => (
                <li
                  key={reason.dimension}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{t(`dimensions.${reason.dimension}`)}</span>
                  <span
                    className={
                      reason.tone === "negative"
                        ? "text-risk font-medium"
                        : reason.tone === "positive"
                          ? "text-healthy font-medium"
                          : "text-attention font-medium"
                    }
                  >
                    {number.format(reason.score)} ·{" "}
                    {t(`freshness.${reason.freshness}`)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-3 text-sm">
              {t("explanation.empty")}
            </p>
          )}
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold">{t("breakdown.title")}</h2>
        <p className="text-muted-foreground mt-1">
          {t("breakdown.description")}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dimensions.map((dimension) => {
            const value = current?.dimensions[dimension];
            return (
              <Card key={dimension} className="p-4">
                <p className="text-muted-foreground text-sm">
                  {t(`dimensions.${dimension}`)}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {value ? number.format(value.score) : t("missing")}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {value
                    ? t("breakdown.detail", {
                        weight: percent.format(value.originalWeight),
                        source: t(`source.${value.source}`),
                        freshness: t(`freshness.${value.freshness}`),
                      })
                    : t("breakdown.noInput")}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="p-5">
        <h2 className="text-lg font-semibold">{t("history.title")}</h2>
        <p className="text-muted-foreground mt-1">{t("history.description")}</p>
        {data.history.some((point) => point.overallScore !== null) ? (
          <div className="mt-5">
            <HistoryChart
              history={data.history}
              label={t("history.chartLabel")}
            />
            <p className="text-muted-foreground mt-3 text-sm">
              {t("history.summary", {
                count: data.history.length,
                first: number.format(
                  data.history.find((point) => point.overallScore !== null)
                    ?.overallScore ?? 0,
                ),
                latest: number.format(current?.overallScore ?? 0),
              })}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground mt-4">{t("history.empty")}</p>
        )}
      </Card>

      {canEdit ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold">{t("inputs.title")}</h2>
          <p className="text-muted-foreground mt-1">
            {t("inputs.description")}
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {dimensions.map((dimension) => {
              const input = inputByDimension.get(dimension);
              return (
                <HealthInputForm
                  key={dimension}
                  customerId={customerId}
                  locale={locale}
                  dimension={dimension}
                  operationKey={randomUUID()}
                  systemOperationKey={randomUUID()}
                  latest={input?.latest ?? null}
                  isManualOverride={input?.isManualOverride ?? false}
                />
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function HistoryChart({
  history,
  label,
}: {
  history: Array<{ id: string; overallScore: number | null }>;
  label: string;
}) {
  const points = history.filter(
    (point): point is typeof point & { overallScore: number } =>
      point.overallScore !== null,
  );
  const coordinates = points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      const y = 34 - (point.overallScore / 100) * 30;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 36"
      className="text-brand h-44 w-full"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <line
        x1="0"
        y1="10"
        x2="100"
        y2="10"
        className="stroke-border"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="0"
        y1="16"
        x2="100"
        y2="16"
        className="stroke-border"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={coordinates}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
