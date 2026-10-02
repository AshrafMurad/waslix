import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OperationalCallout } from "@/components/shared/operational-callout";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { ArchiveCustomerButton } from "@/modules/customers/components/customer-form";
import { CustomerFormDialog } from "@/modules/customers/components/customer-form-dialog";
import { getCustomerOptions } from "@/modules/customers/queries/get-customer-options";
import { getCustomerOverview } from "@/modules/customers/queries/get-customer-overview";
import {
  canArchiveCustomer,
  canAssignCustomerOwner,
  canEditCustomer,
} from "@/modules/customers/services/customer-permissions";
import { GoalSection } from "@/modules/goals/components/goal-section";
import { NextBestActionCard } from "@/modules/recommendations/components/next-best-action-card";
import { getCustomerNextActions } from "@/modules/recommendations/queries/get-customer-next-actions";

function dateInput(date: Date | null) {
  return date?.toISOString().slice(0, 10) ?? "";
}

export default async function CustomerOverviewPage({
  params,
}: {
  params: Promise<{ locale: string; customerId: string }>;
}) {
  const { locale, customerId } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const access = await requireProtectedPage(locale);
  const [customer, options, nextActions, t, healthT, recommendationT] =
    await Promise.all([
      getCustomerOverview(access, customerId),
      getCustomerOptions(access),
      getCustomerNextActions(access, customerId),
      getTranslations({ locale, namespace: "customers" }),
      getTranslations({ locale, namespace: "health" }),
      getTranslations({ locale, namespace: "recommendations" }),
    ]);
  if (!customer) notFound();
  const canEdit =
    customer.status === "ACTIVE" && canEditCustomer(access, customer.owner.id);
  const number = new Intl.NumberFormat(locale);
  const date = new Intl.DateTimeFormat(locale, {
    calendar: "gregory",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const healthTone =
    customer.health?.status === "HEALTHY"
      ? "text-healthy"
      : customer.health?.status === "AT_RISK"
        ? "text-risk"
        : customer.health?.status === "NEEDS_ATTENTION"
          ? "text-attention"
          : "text-foreground";
  const healthValue =
    customer.health?.overallScore !== null &&
    customer.health?.overallScore !== undefined &&
    customer.health.status
      ? `${number.format(customer.health.overallScore)} · ${healthT(`status.${customer.health.status}`)}`
      : healthT("unknown");
  const healthMovement = customer.healthComparison30
    ? healthT(`comparison.${customer.healthComparison30.direction}`, {
        delta: number.format(Math.abs(customer.healthComparison30.delta)),
        days: 30,
      })
    : healthT("comparison.unavailable", { days: 30 });
  const topRecommendation = nextActions?.recommendations[0] ?? null;
  const canAdminister =
    canEdit || (customer.status === "ACTIVE" && canArchiveCustomer(access));

  return (
    <div className="waslix-page">
      <Card className="waslix-panel-body">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="waslix-panel-title">{t("overview.title")}</h2>
            <p className="waslix-panel-description">
              {t("overview.description")}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("overview.ownerContext", { owner: customer.owner.user.name })}
          </p>
        </div>
        <dl className="mt-5 grid gap-4 border-t pt-5 md:grid-cols-3 md:gap-0">
          <div className="min-w-0 md:pe-5">
            <dt className="waslix-label">{t("overview.healthBrief")}</dt>
            <dd className={`mt-2 font-semibold tabular-nums ${healthTone}`}>
              {healthValue}
            </dd>
            <dd className="text-muted-foreground mt-1 text-sm tabular-nums">
              {healthMovement}
            </dd>
            <Button
              asChild
              size="sm"
              variant="link"
              className="mt-2 h-auto p-0"
            >
              <Link href={`/customers/${customerId}/health`}>
                {t("overview.reviewHealth")}
              </Link>
            </Button>
          </div>
          <div className="min-w-0 border-t pt-4 md:border-s md:border-t-0 md:px-5 md:pt-0">
            <dt className="waslix-label">{t("overview.renewalBrief")}</dt>
            <dd className="mt-2 font-semibold tabular-nums">
              {customer.renewalDate
                ? date.format(customer.renewalDate)
                : t("overview.renewalMissing")}
            </dd>
            <dd className="text-muted-foreground mt-1 text-sm">
              {t("overview.renewalContext")}
            </dd>
            <Button
              asChild
              size="sm"
              variant="link"
              className="mt-2 h-auto p-0"
            >
              <Link href={`/customers/${customerId}/renewal`}>
                {t("overview.reviewRenewal")}
              </Link>
            </Button>
          </div>
          <div className="min-w-0 border-t pt-4 md:border-s md:border-t-0 md:ps-5 md:pt-0">
            <dt className="waslix-label">{t("overview.nextWorkBrief")}</dt>
            <dd className="mt-2 font-semibold">
              {topRecommendation
                ? recommendationT(`types.${topRecommendation.type}`)
                : t("overview.nextWorkEmpty")}
            </dd>
            <dd className="text-muted-foreground mt-1 text-sm">
              {topRecommendation
                ? recommendationT(`rules.${topRecommendation.ruleKey}`)
                : t("overview.nextWorkEmptyDescription")}
            </dd>
            <Button
              asChild
              size="sm"
              variant="link"
              className="mt-2 h-auto p-0"
            >
              <Link href={`/customers/${customerId}/tasks`}>
                {t("overview.reviewTasks")}
              </Link>
            </Button>
          </div>
        </dl>
      </Card>
      {nextActions ? (
        <NextBestActionCard
          recommendations={nextActions.recommendations}
          customerId={customerId}
          locale={locale}
          canAct={nextActions.canAct}
        />
      ) : null}
      <GoalSection
        locale={locale}
        customerId={customerId}
        canEdit={canEdit}
        owners={options.owners.map((owner) => ({
          id: owner.id,
          name: owner.user.name,
        }))}
        defaultOwnerId={customer.owner.id}
        goals={customer.successGoals}
      />
      {canAdminister ? (
        <Card className="waslix-panel-body">
          <h2 className="waslix-panel-title">
            {t("overview.administrationTitle")}
          </h2>
          <p className="waslix-panel-description">
            {t("overview.administrationDescription")}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {canEdit ? (
              <CustomerFormDialog
                mode="edit"
                title={t("actions.edit")}
                description={t("overview.administrationDescription")}
                triggerLabel={t("actions.edit")}
                locale={locale}
                customerId={customerId}
                lifecycleStages={options.lifecycleStages}
                owners={options.owners}
                currencies={options.currencies}
                canAssignOwner={canAssignCustomerOwner(access)}
                defaultValues={{
                  name: customer.name,
                  website: customer.website ?? "",
                  industry: customer.industry ?? "",
                  companySize: customer.companySize?.toString() ?? "",
                  contractValue: customer.contractValue ?? "",
                  currency: customer.currency,
                  customerSince: dateInput(customer.customerSince),
                  renewalDate: dateInput(customer.renewalDate),
                  lifecycleStageId: customer.lifecycleStage.id,
                  ownerId: customer.owner.id,
                  tags: customer.tags.map((tag) => tag.name).join(", "),
                }}
              />
            ) : null}
            {customer.status === "ACTIVE" && canArchiveCustomer(access) ? (
              <ArchiveCustomerButton customerId={customerId} locale={locale} />
            ) : null}
          </div>
          {customer.status === "ACTIVE" && canArchiveCustomer(access) ? (
            <div className="mt-4">
              <OperationalCallout
                title={t("archive.consequenceTitle")}
                description={t("archive.consequenceDescription")}
                tone="attention"
              />
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
