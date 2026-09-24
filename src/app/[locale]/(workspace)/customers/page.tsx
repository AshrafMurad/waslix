import { Plus, Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { CustomerForm } from "@/modules/customers/components/customer-form";
import { CustomerTable } from "@/modules/customers/components/customer-table";
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-brand-accent text-xs font-medium tracking-wide uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl">{t("description")}</p>
        </div>
        {canCreateCustomer(access) && initialStage && initialOwner ? (
          <details className="group relative">
            <summary className="bg-primary text-primary-foreground flex min-h-10 list-none items-center justify-center gap-2 rounded-md px-4 font-medium [&::-webkit-details-marker]:hidden">
              <Plus aria-hidden="true" className="size-4" />
              {t("actions.add")}
            </summary>
            <Card className="absolute end-0 z-20 mt-2 w-[min(44rem,calc(100vw-2rem))] p-5 shadow-lg">
              <h2 className="mb-4 text-lg font-semibold">{t("createTitle")}</h2>
              <CustomerForm
                locale={locale}
                lifecycleStages={options.lifecycleStages}
                owners={options.owners}
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
            </Card>
          </details>
        ) : null}
      </div>

      <Card>
        <form
          className="flex flex-col gap-3 border-b p-4 lg:flex-row"
          action={`/${locale}/customers`}
        >
          <label className="relative min-w-64 flex-1">
            <span className="sr-only">{t("filters.search")}</span>
            <Search
              aria-hidden="true"
              className="text-muted-foreground absolute start-3 top-3 size-4"
            />
            <input
              name="query"
              defaultValue={portfolio.filters.query}
              placeholder={t("filters.search")}
              className="bg-background h-10 w-full rounded-md border ps-10 pe-3"
              dir="auto"
            />
          </label>
          <FilterSelect
            name="lifecycle"
            label={t("filters.lifecycle")}
            defaultValue={portfolio.filters.lifecycle}
          >
            <option value="">{t("filters.allLifecycle")}</option>
            {options.lifecycleStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            name="owner"
            label={t("filters.owner")}
            defaultValue={portfolio.filters.owner}
          >
            <option value="all">{t("filters.allOwners")}</option>
            {options.owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.user.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            name="status"
            label={t("filters.status")}
            defaultValue={portfolio.filters.status}
          >
            <option value="ACTIVE">{t("status.ACTIVE")}</option>
            <option value="ARCHIVED">{t("status.ARCHIVED")}</option>
            <option value="ALL">{t("filters.allStatuses")}</option>
          </FilterSelect>
          <FilterSelect
            name="sort"
            label={t("filters.sort")}
            defaultValue={portfolio.filters.sort}
          >
            <option value="asc">{t("filters.nameAsc")}</option>
            <option value="desc">{t("filters.nameDesc")}</option>
          </FilterSelect>
          <button className="bg-secondary hover:bg-raised h-10 rounded-md px-4 font-medium">
            {t("filters.apply")}
          </button>
        </form>
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
            }}
          />
        ) : (
          <div className="px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">
              {t(
                filters.query ||
                  filters.lifecycle ||
                  filters.owner ||
                  filters.status === "ARCHIVED"
                  ? "filteredEmptyTitle"
                  : "emptyTitle",
              )}
            </h2>
            <p className="text-muted-foreground mt-2">
              {t(
                filters.query ||
                  filters.lifecycle ||
                  filters.owner ||
                  filters.status === "ARCHIVED"
                  ? "filteredEmptyDescription"
                  : "emptyDescription",
              )}
            </p>
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
          </div>
        )}
      </Card>
      {nextHref ? (
        <div className="flex justify-end">
          <Link
            href={nextHref}
            className="hover:bg-raised rounded-md border px-4 py-2 font-medium"
          >
            {t("pagination.next")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-muted-foreground grid gap-1 text-xs">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="bg-background text-foreground h-10 min-w-36 rounded-md border px-3 text-sm"
      >
        {children}
      </select>
    </label>
  );
}
