import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { isLocale } from "@/i18n/config";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { CustomerTabs } from "@/modules/customers/components/customer-tabs";
import { CustomerHeaderActions } from "@/modules/customers/components/customer-header-actions";
import { getCustomerOverview } from "@/modules/customers/queries/get-customer-overview";
import { canEditCustomer } from "@/modules/customers/services/customer-permissions";
import { getActivityOptions } from "@/modules/activities/queries/get-activity-options";
import { getRiskOptions } from "@/modules/risks/queries/get-risks";
import { getTaskOptions } from "@/modules/tasks/queries/get-task-options";

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; customerId: string }>;
}) {
  const { locale, customerId } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const access = await requireProtectedPage(locale);
  const [customer, t, healthT] = await Promise.all([
    getCustomerOverview(access, customerId),
    getTranslations({ locale, namespace: "customers" }),
    getTranslations({ locale, namespace: "health" }),
  ]);
  if (!customer) notFound();
  const canManage =
    customer.status === "ACTIVE" && canEditCustomer(access, customer.owner.id);
  const [activityContacts, taskOptions, riskOptions] = canManage
    ? await Promise.all([
        getActivityOptions(access, customerId),
        getTaskOptions(access),
        getRiskOptions(access),
      ])
    : [[], { owners: [], customers: [] }, { owners: [], customers: [] }];
  const visibleTaskOwners = canManage
    ? taskOptions.owners
    : taskOptions.owners.filter((owner) => owner.id === access.memberId);
  const primaryContact = customer.contacts.find(
    (contact) => contact.isPrimary && contact.status === "ACTIVE",
  );
  const money = customer.contractValue
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: customer.currency,
        currencyDisplay: "code",
      }).format(Number(customer.contractValue))
    : t("missing");
  const renewal = customer.renewalDate
    ? new Intl.DateTimeFormat(locale, {
        calendar: "gregory",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(customer.renewalDate)
    : t("missing");

  return (
    <div className="waslix-page">
      {customer.status === "ARCHIVED" ? (
        <div className="border-attention/40 bg-attention/10 text-attention rounded-md border px-4 py-3 font-medium">
          {t("archivedBanner")}
        </div>
      ) : null}
      <header className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-14 rounded-md">
            <AvatarFallback className="bg-brand text-brand-foreground rounded-md text-xl">
              {customer.name.trim().charAt(0).toLocaleUpperCase(locale)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-start">
            <h1 className="waslix-page-title truncate text-start">
              <bdi dir="auto">{customer.name}</bdi>
            </h1>
            <p className="text-muted-foreground mt-1 text-start">
              <bdi dir="auto">{customer.industry ?? t("missing")}</bdi>
            </p>
          </div>
          <div className="bg-surface w-full rounded-md border px-4 py-3 sm:w-auto sm:min-w-48">
            <p className="text-muted-foreground text-xs">
              {t("summary.health")}
            </p>
            <p
              className={
                customer.health?.status === "HEALTHY"
                  ? "text-healthy mt-1 font-medium"
                  : customer.health?.status === "AT_RISK"
                    ? "text-risk mt-1 font-medium"
                    : customer.health?.status === "NEEDS_ATTENTION"
                      ? "text-attention mt-1 font-medium"
                      : "mt-1 font-medium"
              }
            >
              {customer.health?.overallScore !== null &&
              customer.health?.overallScore !== undefined &&
              customer.health.status
                ? `${new Intl.NumberFormat(locale).format(customer.health.overallScore)} · ${healthT(`status.${customer.health.status}`)}`
                : t("healthUnknown")}
            </p>
          </div>
        </div>
        <CustomerHeaderActions
          locale={locale}
          customerId={customerId}
          canManage={canManage}
          contacts={activityContacts}
          taskOwners={visibleTaskOwners}
          taskCustomers={taskOptions.customers}
          riskOwners={riskOptions.owners}
          riskCustomers={riskOptions.customers}
          defaultOwnerId={access.memberId}
          canAssignOwner={
            access.role === "ADMIN" || access.role === "CS_MANAGER"
          }
        />
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            [t("summary.owner"), customer.owner.user.name],
            [t("summary.lifecycle"), customer.lifecycleStage.name],
            [t("summary.contract"), money],
            [t("summary.renewal"), renewal],
            [t("summary.primaryContact"), primaryContact?.name ?? t("missing")],
          ].map(([label, value]) => (
            <div key={label} className="bg-surface rounded-md border p-4">
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="mt-1 truncate text-start font-medium">
                <bdi dir="auto">{value}</bdi>
              </dd>
            </div>
          ))}
        </dl>
        <CustomerTabs
          customerId={customerId}
          label={t("tabs.label")}
          labels={{
            overview: t("tabs.overview"),
            health: t("tabs.health"),
            timeline: t("tabs.timeline"),
            onboarding: t("tabs.onboarding"),
            risks: t("tabs.risks"),
            tasks: t("tabs.tasks"),
            renewal: t("tabs.renewal"),
            contacts: t("tabs.contacts"),
          }}
        />
      </header>
      {children}
    </div>
  );
}
