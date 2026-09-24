import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { isLocale } from "@/i18n/config";
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
  const [customer, options, t] = await Promise.all([
    getCustomerOverview(access, customerId),
    getCustomerOptions(access),
    getTranslations({ locale, namespace: "customers" }),
  ]);
  if (!customer) notFound();
  const canEdit =
    customer.status === "ACTIVE" && canEditCustomer(access, customer.owner.id);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">{t("overview.title")}</h2>
          <p className="text-muted-foreground mt-2">
            {t("overview.description")}
          </p>
          <div className="bg-raised mt-5 rounded-md p-4">
            <h3 className="font-medium">{t("overview.healthTitle")}</h3>
            <p className="text-muted-foreground mt-1">
              {customer.health?.overallScore !== null &&
              customer.health?.overallScore !== undefined
                ? new Intl.NumberFormat(locale).format(
                    customer.health.overallScore,
                  )
                : t("overview.healthUnknown")}
            </p>
          </div>
        </Card>
        <div className="space-y-4">
          {canEdit ? (
            <CustomerFormDialog
              mode="edit"
              title={t("actions.edit")}
              description={t("overview.description")}
              triggerLabel={t("actions.edit")}
              locale={locale}
              customerId={customerId}
              lifecycleStages={options.lifecycleStages}
              owners={options.owners}
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
            <Card className="p-5">
              <h2 className="font-semibold">{t("archive.title")}</h2>
              <p className="text-muted-foreground my-2">
                {t("archive.description")}
              </p>
              <ArchiveCustomerButton customerId={customerId} locale={locale} />
            </Card>
          ) : null}
        </div>
      </div>
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
    </div>
  );
}
