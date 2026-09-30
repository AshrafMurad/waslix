import { randomUUID } from "node:crypto";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { RiskFormDialog } from "@/modules/risks/components/risk-form-dialog";
import { RiskList } from "@/modules/risks/components/risk-list";
import { getRiskOptions, getRisks } from "@/modules/risks/queries/get-risks";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RisksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const access = await requireProtectedPage(locale);
  const raw = await searchParams;
  const [result, options, t] = await Promise.all([
    getRisks(access, { cursor: first(raw.cursor), status: first(raw.status) }),
    getRiskOptions(access),
    getTranslations({ locale, namespace: "risks" }),
  ]);
  const risks = result.risks.map((risk) => ({
    id: risk.id,
    customerId: risk.customerId,
    title: risk.title,
    description: risk.description,
    type: risk.type,
    severity: risk.severity,
    status: risk.status,
    targetResolutionDate:
      risk.targetResolutionDate?.toISOString().slice(0, 10) ?? null,
    resolutionNote: risk.resolutionNote,
    ownerId: risk.ownerId,
    customerName: risk.customer.name,
    ownerName: risk.owner.user.name,
    mitigationCount: risk.tasks.length,
    updatedAt: risk.updatedAt.toISOString(),
    canManage:
      risk.customer.status === "ACTIVE" &&
      access.role !== "VIEWER" &&
      (access.role === "ADMIN" ||
        access.role === "CS_MANAGER" ||
        access.memberId === risk.customer.ownerId ||
        access.memberId === risk.ownerId),
  }));
  const manageableCustomers =
    access.role === "CSM"
      ? options.customers.filter(
          (customer) => customer.ownerId === access.memberId,
        )
      : options.customers;
  return (
    <div className="waslix-page">
      <div className="waslix-page-header">
        <div className="space-y-1">
          <p className="waslix-eyebrow">{t("eyebrow")}</p>
          <h1 className="waslix-page-title">{t("title")}</h1>
          <p className="waslix-page-description max-w-2xl">
            {t("description")}
          </p>
        </div>
        {access.role !== "VIEWER" && manageableCustomers.length ? (
          <RiskFormDialog
            locale={locale}
            initialOperationKey={randomUUID()}
            customers={manageableCustomers}
            owners={options.owners}
          />
        ) : null}
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <RiskList
          risks={risks}
          locale={locale}
          customers={options.customers}
          owners={options.owners}
        />
      </Card>
      {result.nextCursor ? (
        <div className="flex justify-end">
          <Link
            href={`/risks?cursor=${result.nextCursor}`}
            className="bg-surface hover:bg-raised border-border/80 rounded-md border px-4 py-2 font-medium transition-colors"
          >
            {t("pagination.next")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
