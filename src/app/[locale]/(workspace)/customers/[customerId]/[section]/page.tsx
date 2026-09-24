import { randomUUID } from "node:crypto";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { ActivityForm } from "@/modules/activities/components/activity-form";
import { getActivityOptions } from "@/modules/activities/queries/get-activity-options";
import {
  ContactForm,
  SetPrimaryContactButton,
} from "@/modules/customers/components/contact-form";
import { getCustomerOverview } from "@/modules/customers/queries/get-customer-overview";
import { canEditCustomer } from "@/modules/customers/services/customer-permissions";
import { TaskForm } from "@/modules/tasks/components/task-form";
import { TaskList } from "@/modules/tasks/components/task-list";
import { getTaskOptions } from "@/modules/tasks/queries/get-task-options";
import { getTasks } from "@/modules/tasks/queries/get-tasks";
import { TimelineList } from "@/modules/timeline/components/timeline-list";
import { getCustomerTimeline } from "@/modules/timeline/queries/get-customer-timeline";

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
  searchParams,
}: {
  params: Promise<{ locale: string; customerId: string; section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

  const rawSearch = await searchParams;
  const filterValue = rawSearch.filter;
  const cursorValue = rawSearch.cursor;
  const filter = Array.isArray(filterValue) ? filterValue[0] : filterValue;
  const cursor = Array.isArray(cursorValue) ? cursorValue[0] : cursorValue;

  if (section === "tasks") {
    const [result, options, taskT] = await Promise.all([
      getTasks(access, { filter, cursor, customerId }),
      getTaskOptions(access),
      getTranslations({ locale, namespace: "tasks" }),
    ]);
    const canManageAccount = canEditCustomer(access, customer.owner.id);
    const visibleOwners = canManageAccount
      ? options.owners
      : options.owners.filter((owner) => owner.id === access.memberId);
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card>
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">{taskT("title")}</h2>
            <p className="text-muted-foreground mt-1">{taskT("description")}</p>
          </div>
          <TaskList
            access={access}
            locale={locale}
            tasks={result.tasks}
            owners={options.owners}
            customers={options.customers}
            lockedCustomerId={customerId}
            timezone={result.timezone}
          />
          {result.nextCursor ? (
            <div className="flex justify-end border-t p-4">
              <Link
                href={`/customers/${customerId}/tasks?filter=${result.filter}&cursor=${result.nextCursor}`}
                className="hover:bg-raised rounded-md border px-4 py-2 font-medium"
              >
                {taskT("pagination.next")}
              </Link>
            </div>
          ) : null}
        </Card>
        {access.role !== "VIEWER" && visibleOwners.length ? (
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">{taskT("actions.add")}</h2>
            <TaskForm
              locale={locale}
              operationKey={randomUUID()}
              lockedCustomerId={customerId}
              owners={visibleOwners}
              customers={options.customers}
              defaultOwnerId={access.memberId}
              canAssignOwner={canManageAccount}
            />
          </Card>
        ) : null}
      </div>
    );
  }

  if (section === "timeline") {
    const [timeline, contacts, timelineT] = await Promise.all([
      getCustomerTimeline(access, customerId, { filter, cursor }),
      getActivityOptions(access, customerId),
      getTranslations({ locale, namespace: "timeline" }),
    ]);
    if (!timeline) notFound();
    const canAddActivity =
      customer.status === "ACTIVE" &&
      canEditCustomer(access, customer.owner.id);
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card>
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">{timelineT("title")}</h2>
            <p className="text-muted-foreground mt-1">
              {timelineT("description")}
            </p>
          </div>
          <nav
            aria-label={timelineT("filters.label")}
            className="flex gap-1 overflow-x-auto border-b p-2"
          >
            {(["all", "human", "system", "tasks"] as const).map((item) => (
              <Link
                key={item}
                href={`/customers/${customerId}/timeline?filter=${item}`}
                className={
                  timeline.filter === item
                    ? "bg-raised min-h-10 rounded-md px-3 py-2 text-sm font-medium"
                    : "text-muted-foreground hover:bg-raised min-h-10 rounded-md px-3 py-2 text-sm"
                }
              >
                {timelineT(`filters.${item}`)}
              </Link>
            ))}
          </nav>
          <TimelineList locale={locale} entries={timeline.entries} />
          {timeline.nextCursor ? (
            <div className="flex justify-end border-t p-4">
              <Link
                href={`/customers/${customerId}/timeline?filter=${timeline.filter}&cursor=${timeline.nextCursor}`}
                className="hover:bg-raised rounded-md border px-4 py-2 font-medium"
              >
                {timelineT("actions.next")}
              </Link>
            </div>
          ) : null}
        </Card>
        {canAddActivity ? (
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">
              {timelineT("activity.addTitle")}
            </h2>
            <ActivityForm
              customerId={customerId}
              locale={locale}
              operationKey={randomUUID()}
              contacts={contacts}
            />
          </Card>
        ) : null}
      </div>
    );
  }

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
