import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { isLocale } from "@/i18n/config";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import {
  ContactForm,
  SetPrimaryContactButton,
} from "@/modules/customers/components/contact-form";
import { getCustomerOverview } from "@/modules/customers/queries/get-customer-overview";
import { canEditCustomer } from "@/modules/customers/services/customer-permissions";

const sections = [
  "health",
  "timeline",
  "onboarding",
  "risks",
  "tasks",
  "renewal",
  "contacts",
] as const;

export default async function CustomerSectionPage({
  params,
}: {
  params: Promise<{ locale: string; customerId: string; section: string }>;
}) {
  const { locale, customerId, section } = await params;
  if (
    !isLocale(locale) ||
    !sections.includes(section as (typeof sections)[number])
  )
    notFound();
  setRequestLocale(locale);
  const access = await requireProtectedPage(locale);
  const [customer, t] = await Promise.all([
    getCustomerOverview(access, customerId),
    getTranslations({ locale, namespace: "customers" }),
  ]);
  if (!customer) notFound();

  if (section !== "contacts") {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold">{t(`tabs.${section}`)}</h2>
        <p className="text-muted-foreground mt-2">{t("futurePlaceholder")}</p>
      </Card>
    );
  }

  const canEdit =
    customer.status === "ACTIVE" && canEditCustomer(access, customer.owner.id);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <Card>
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">{t("contacts.title")}</h2>
          <p className="text-muted-foreground mt-1">
            {t("contacts.description")}
          </p>
        </div>
        {customer.contacts.length ? (
          <ul className="divide-y">
            {customer.contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"
              >
                <span className="bg-brand text-brand-foreground flex size-10 shrink-0 items-center justify-center rounded-full font-semibold">
                  {contact.name.trim().charAt(0).toLocaleUpperCase(locale)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium" dir="auto">
                    {contact.name}
                  </p>
                  <p
                    className="text-muted-foreground truncate text-sm"
                    dir="ltr"
                  >
                    {contact.email ?? t("missing")}
                  </p>
                  <p className="text-muted-foreground text-xs" dir="auto">
                    {contact.jobTitle ??
                      t(`contacts.roles.${contact.accountRole}`)}
                  </p>
                </div>
                {contact.isPrimary ? (
                  <span className="text-healthy text-sm font-medium">
                    {t("contacts.primary")}
                  </span>
                ) : canEdit && contact.status === "ACTIVE" ? (
                  <SetPrimaryContactButton
                    customerId={customerId}
                    contactId={contact.id}
                    locale={locale}
                  />
                ) : null}
                {canEdit ? (
                  <details className="sm:ms-2">
                    <summary className="text-brand-accent font-medium">
                      {t("contacts.edit")}
                    </summary>
                    <div className="mt-4 min-w-72 rounded-md border p-4 sm:min-w-96">
                      <ContactForm
                        customerId={customerId}
                        locale={locale}
                        contact={contact}
                      />
                    </div>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground p-6">{t("contacts.empty")}</p>
        )}
      </Card>
      {canEdit ? (
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">{t("contacts.addTitle")}</h2>
          <ContactForm customerId={customerId} locale={locale} />
        </Card>
      ) : null}
    </div>
  );
}
