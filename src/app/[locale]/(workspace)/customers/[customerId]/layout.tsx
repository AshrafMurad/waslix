import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { getCustomerOverview } from "@/modules/customers/queries/get-customer-overview";

const tabs = [
  "overview",
  "health",
  "timeline",
  "onboarding",
  "risks",
  "tasks",
  "renewal",
  "contacts",
] as const;

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
  const [customer, t] = await Promise.all([
    getCustomerOverview(access, customerId),
    getTranslations({ locale, namespace: "customers" }),
  ]);
  if (!customer) notFound();
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
    <div className="space-y-6">
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
          <div className="min-w-0 flex-1">
            <p className="text-brand-accent text-xs font-medium tracking-wide uppercase">
              {t("customer360")}
            </p>
            <h1
              className="truncate text-2xl font-semibold tracking-tight"
              dir="auto"
            >
              {customer.name}
            </h1>
            <p className="text-muted-foreground mt-1" dir="auto">
              {customer.industry ?? t("missing")}
            </p>
          </div>
          <div className="rounded-md border px-4 py-3">
            <p className="text-muted-foreground text-xs">
              {t("summary.health")}
            </p>
            <p className="mt-1 font-medium">{t("healthUnknown")}</p>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            [t("summary.owner"), customer.owner.user.name],
            [t("summary.lifecycle"), customer.lifecycleStage.name],
            [t("summary.contract"), money],
            [t("summary.renewal"), renewal],
            [t("summary.primaryContact"), primaryContact?.name ?? t("missing")],
          ].map(([label, value]) => (
            <div key={label} className="bg-surface rounded-md border p-4">
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="mt-1 truncate font-medium" dir="auto">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <nav aria-label={t("tabs.label")} className="overflow-x-auto border-b">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab}
                href={
                  tab === "overview"
                    ? `/customers/${customerId}`
                    : `/customers/${customerId}/${tab}`
                }
                className="hover:bg-raised min-h-10 rounded-t-md px-3 py-2 font-medium"
              >
                {t(`tabs.${tab}`)}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
