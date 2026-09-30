import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { CustomerFilters } from "@/modules/customers/components/customer-filters";
import { CustomerFormDialog } from "@/modules/customers/components/customer-form-dialog";
import { CustomerTable } from "@/modules/customers/components/customer-table";
import { CustomerImportForm } from "@/modules/imports/components/customer-import-form";
import { getCustomerOptions } from "@/modules/customers/queries/get-customer-options";
import { getCustomerPortfolio } from "@/modules/customers/queries/get-customer-portfolio";
import { canCreateCustomer } from "@/modules/customers/services/customer-permissions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomersPage({
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
    query: first(raw.query) ?? "",
    lifecycle: first(raw.lifecycle),
    owner: first(raw.owner),
    status: first(raw.status),
    sort: first(raw.sort),
    cursor: first(raw.cursor),
  };
  const [portfolio, options, t] = await Promise.all([
    getCustomerPortfolio(access, filters),
    getCustomerOptions(access),
    getTranslations({ locale, namespace: "customers" }),
  ]);
  const initialStage = options.lifecycleStages[0];
  const initialOwner =
    options.owners.find((owner) => owner.id === access.memberId) ??
    options.owners[0];

  const nextHref = portfolio.nextCursor
    ? `/customers?${new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).filter((entry): entry is [string, string] =>
            Boolean(entry[1]),
          ),
        ),
        cursor: portfolio.nextCursor,
      }).toString()}`
    : null;

  return (
    <div className="waslix-page">
      <div className="waslix-page-header">
        <div className="space-y-1">
          <h1 className="waslix-page-title">{t("title")}</h1>
          <p className="waslix-page-description max-w-2xl">
            {t("description")}
          </p>
        </div>
        {canCreateCustomer(access) && initialStage && initialOwner ? (
          <CustomerFormDialog
            mode="create"
            title={t("createTitle")}
            description={t("description")}
            triggerLabel={t("actions.add")}
            locale={locale}
            lifecycleStages={options.lifecycleStages}
            owners={options.owners}
            currencies={options.currencies}
            canAssignOwner={
              access.role === "ADMIN" || access.role === "CS_MANAGER"
            }
            defaultValues={{
              name: "",
              website: "",
              industry: "",
              companySize: "",
              contractValue: "",
              currency: options.defaultCurrency,
              customerSince: "",
              renewalDate: "",
              lifecycleStageId: initialStage.id,
              ownerId: initialOwner.id,
              tags: "",
            }}
          />
        ) : null}
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <CustomerFilters
          key={JSON.stringify(portfolio.filters)}
          filters={{
            query: portfolio.filters.query,
            lifecycle: portfolio.filters.lifecycle ?? "",
            owner: portfolio.filters.owner ?? "all",
            status: portfolio.filters.status,
            sort: portfolio.filters.sort,
          }}
          lifecycleStages={options.lifecycleStages}
          owners={options.owners}
          labels={{
            search: t("filters.search"),
            loading: t("filters.loading"),
            lifecycle: t("filters.lifecycle"),
            allLifecycle: t("filters.allLifecycle"),
            owner: t("filters.owner"),
            allOwners: t("filters.allOwners"),
            status: t("filters.status"),
            active: t("status.ACTIVE"),
            archived: t("status.ARCHIVED"),
            allStatuses: t("filters.allStatuses"),
            sort: t("filters.sort"),
            nameAsc: t("filters.nameAsc"),
            nameDesc: t("filters.nameDesc"),
            filterTitle: t("filters.filterTitle"),
            filterDescription: t("filters.filterDescription"),
            done: t("filters.done"),
          }}
        />
        {portfolio.customers.length ? (
          <CustomerTable
            rows={portfolio.customers}
            locale={locale}
            labels={{
              customer: t("table.customer"),
              health: t("table.health"),
              lifecycle: t("table.lifecycle"),
              owner: t("table.owner"),
              value: t("table.value"),
              renewal: t("table.renewal"),
              unknown: t("healthUnknown"),
              archived: t("status.ARCHIVED"),
              missing: t("missing"),
              scrollHint: t("table.scrollHint"),
            }}
          />
        ) : (
          <Empty>
            <EmptyTitle>
              {t(
                filters.query ||
                  filters.lifecycle ||
                  filters.owner ||
                  filters.status === "ARCHIVED"
                  ? "filteredEmptyTitle"
                  : "emptyTitle",
              )}
            </EmptyTitle>
            <EmptyDescription>
              {t(
                filters.query ||
                  filters.lifecycle ||
                  filters.owner ||
                  filters.status === "ARCHIVED"
                  ? "filteredEmptyDescription"
                  : "emptyDescription",
              )}
            </EmptyDescription>
            {filters.query ||
            filters.lifecycle ||
            filters.owner ||
            filters.status === "ARCHIVED" ? (
              <Link
                href="/customers"
                className="text-brand-accent mt-4 inline-block font-medium hover:underline"
              >
                {t("filters.clear")}
              </Link>
            ) : null}
          </Empty>
        )}
      </Card>
      {access.role === "ADMIN" ? (
        <Card className="waslix-panel-body">
          <div className="mb-4 space-y-1">
            <h2 className="waslix-panel-title">{t("import.title")}</h2>
            <p className="waslix-panel-description">
              {t("import.description")}
            </p>
          </div>
          <CustomerImportForm
            labels={{
              file: t("import.file"),
              mapping: t("import.mapping"),
              unmapped: t("import.unmapped"),
              submit: t("import.submit"),
              validate: t("import.validate"),
              importValidRows: t("import.importValidRows"),
              retry: t("import.retry"),
              pending: t("import.pending"),
              success: t("import.success"),
              error: t("import.error"),
              countSuccess: t("import.countSuccess"),
              countFailed: t("import.countFailed"),
              countSkipped: t("import.countSkipped"),
              row: t("import.row"),
              columns: {
                customer_name: t("import.columns.customer_name"),
                external_key: t("import.columns.external_key"),
                website: t("import.columns.website"),
                industry: t("import.columns.industry"),
                company_size: t("import.columns.company_size"),
                owner_email: t("import.columns.owner_email"),
                lifecycle_stage_key: t("import.columns.lifecycle_stage_key"),
                contract_value: t("import.columns.contract_value"),
                currency: t("import.columns.currency"),
                customer_since: t("import.columns.customer_since"),
                renewal_date: t("import.columns.renewal_date"),
                primary_contact_name: t("import.columns.primary_contact_name"),
                primary_contact_email: t(
                  "import.columns.primary_contact_email",
                ),
                primary_contact_role: t("import.columns.primary_contact_role"),
                tags: t("import.columns.tags"),
              },
              errors: {
                customer_name_required: t(
                  "import.errors.customer_name_required",
                ),
                owner_email_unknown: t("import.errors.owner_email_unknown"),
                lifecycle_stage_unknown: t(
                  "import.errors.lifecycle_stage_unknown",
                ),
                external_key_duplicate: t(
                  "import.errors.external_key_duplicate",
                ),
                name_website_duplicate: t(
                  "import.errors.name_website_duplicate",
                ),
                company_size_invalid: t("import.errors.company_size_invalid"),
                contract_value_invalid: t(
                  "import.errors.contract_value_invalid",
                ),
                currency_invalid: t("import.errors.currency_invalid"),
                date_invalid: t("import.errors.date_invalid"),
                primary_contact_role_invalid: t(
                  "import.errors.primary_contact_role_invalid",
                ),
                initial_renewal_incomplete: t(
                  "import.errors.initial_renewal_incomplete",
                ),
                row_import_failed: t("import.errors.row_import_failed"),
              },
            }}
          />
        </Card>
      ) : null}
      {nextHref ? (
        <div className="flex justify-end pt-1">
          <Button asChild variant="outline">
            <Link href={nextHref}>{t("pagination.next")}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
