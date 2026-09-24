import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { CustomerForm } from "@/modules/customers/components/customer-form";
import { CustomerFilters } from "@/modules/customers/components/customer-filters";
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
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus aria-hidden="true" />
                {t("actions.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{t("createTitle")}</DialogTitle>
                <DialogDescription>{t("description")}</DialogDescription>
              </DialogHeader>
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
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <Card>
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
