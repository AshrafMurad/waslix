import { randomUUID } from "node:crypto";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { DashboardPagination } from "@/components/dashboard/dashboard-pagination";
import { isLocale } from "@/i18n/config";
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
    getRisks(access, { page: first(raw.page), status: first(raw.status) }),
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
  function getPageHref(page: number) {
    const params = new URLSearchParams({
      ...(first(raw.status) ? { status: first(raw.status) ?? "" } : {}),
      ...(page > 1 ? { page: String(page) } : {}),
    });
    const query = params.toString();
    return query ? `/risks?${query}` : "/risks";
  }
  return (
    <div className="waslix-page">
      <div className="waslix-page-header">
        <div className="space-y-1">
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
      <DashboardPagination
        currentPage={result.pagination.currentPage}
        totalPages={result.pagination.totalPages}
        getPageHref={getPageHref}
        labels={{
          summary: t("pagination.summary", {
            page: result.pagination.currentPage,
            total: result.pagination.totalPages,
            count: result.pagination.totalCount,
          }),
          previous: t("pagination.previous"),
          next: t("pagination.next"),
          page: (page) => t("pagination.page", { page }),
        }}
      />
    </div>
  );
}
