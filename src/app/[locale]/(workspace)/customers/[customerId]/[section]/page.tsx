import { randomUUID } from "node:crypto";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardPagination } from "@/components/dashboard/dashboard-pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { HealthOverview } from "@/modules/health/components/health-overview";
import { getHealthOverview } from "@/modules/health/queries/get-health-overview";
import { OnboardingPanel } from "@/modules/onboarding/components/onboarding-panel";
import { getCustomerOnboarding } from "@/modules/onboarding/queries/get-customer-onboarding";
import { RenewalPanel } from "@/modules/renewals/components/renewal-panel";
import { getCustomerRenewals } from "@/modules/renewals/queries/get-renewals";
import { RiskFormDialog } from "@/modules/risks/components/risk-form-dialog";
import { RiskList } from "@/modules/risks/components/risk-list";
import { getRiskOptions, getRisks } from "@/modules/risks/queries/get-risks";
import { TaskForm } from "@/modules/tasks/components/task-form";
import { TaskList } from "@/modules/tasks/components/task-list";
import { getTaskOptions } from "@/modules/tasks/queries/get-task-options";
import { getTasks } from "@/modules/tasks/queries/get-tasks";
import { TimelineList } from "@/modules/timeline/components/timeline-list";
import { getCustomerTimeline } from "@/modules/timeline/queries/get-customer-timeline";
import { getWorkspaceMembers } from "@/modules/workspace/queries/get-workspace-members";
import { getActiveWorkspaceCurrencies } from "@/modules/workspace/queries/get-workspace-currencies";

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
  const pageValue = rawSearch.page;
  const filter = Array.isArray(filterValue) ? filterValue[0] : filterValue;
  const page = Array.isArray(pageValue) ? pageValue[0] : pageValue;

  if (section === "health") {
    const windowValue = Array.isArray(rawSearch.window)
      ? rawSearch.window[0]
      : rawSearch.window;
    const activeWindow =
      windowValue === "7" || windowValue === "30" || windowValue === "90"
        ? (Number(windowValue) as 7 | 30 | 90)
        : 90;
    const health = await getHealthOverview(access, customerId);
    if (!health) notFound();
    return (
      <HealthOverview
        customerId={customerId}
        locale={locale}
        data={health}
        activeWindow={activeWindow}
        canEdit={
          customer.status === "ACTIVE" &&
          canEditCustomer(access, customer.owner.id)
        }
      />
    );
  }

  if (section === "tasks") {
    const [result, options, taskT] = await Promise.all([
      getTasks(access, { filter, page, customerId }),
      getTaskOptions(access),
      getTranslations({ locale, namespace: "tasks" }),
    ]);
    const canManageAccount = canEditCustomer(access, customer.owner.id);
    const visibleOwners = canManageAccount
      ? options.owners
      : options.owners.filter((owner) => owner.id === access.memberId);
    return (
      <div className="waslix-two-column">
        <Card>
          <div className="waslix-panel-header">
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
          <DashboardPagination
            className="border-t p-4"
            currentPage={result.pagination.currentPage}
            totalPages={result.pagination.totalPages}
            getPageHref={(targetPage) =>
              `/customers/${customerId}/tasks?${new URLSearchParams({
                filter: result.filter,
                ...(targetPage > 1 ? { page: String(targetPage) } : {}),
              }).toString()}`
            }
            labels={{
              summary: taskT("pagination.summary", {
                page: result.pagination.currentPage,
                total: result.pagination.totalPages,
                count: result.pagination.totalCount,
              }),
              previous: taskT("pagination.previous"),
              next: taskT("pagination.next"),
              page: (page) => taskT("pagination.page", { page }),
            }}
          />
        </Card>
        {access.role !== "VIEWER" && visibleOwners.length ? (
          <Card className="waslix-panel-body">
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

  if (section === "onboarding") {
    const [onboarding, members] = await Promise.all([
      getCustomerOnboarding(access, customerId),
      getWorkspaceMembers(access),
    ]);
    if (!onboarding) notFound();
    const owners = members
      .filter(
        (member) =>
          member.status === "ACTIVE" &&
          ["ADMIN", "CS_MANAGER", "CSM"].includes(member.role),
      )
      .map((member) => ({ id: member.id, name: member.user.name }));
    const canManage =
      customer.status === "ACTIVE" &&
      canEditCustomer(access, customer.owner.id);
    return (
      <OnboardingPanel
        locale={locale}
        customerId={customerId}
        onboarding={onboarding.customer.onboarding}
        progress={onboarding.progress}
        owners={owners}
        defaultOwnerId={customer.owner.id}
        canManage={canManage}
        shouldSuggestAdoption={onboarding.shouldSuggestAdoption}
      />
    );
  }

  if (section === "renewal") {
    const [renewalCustomer, members, currencies] = await Promise.all([
      getCustomerRenewals(access, customerId),
      getWorkspaceMembers(access),
      getActiveWorkspaceCurrencies(access),
    ]);
    if (!renewalCustomer) notFound();
    const owners = members
      .filter(
        (member) =>
          member.status === "ACTIVE" &&
          ["ADMIN", "CS_MANAGER", "CSM"].includes(member.role),
      )
      .map((member) => ({ id: member.id, name: member.user.name }));
    const canManage =
      customer.status === "ACTIVE" &&
      canEditCustomer(access, customer.owner.id);
    return (
      <RenewalPanel
        locale={locale}
        customerId={customerId}
        renewals={renewalCustomer.renewals.map((renewal) => ({
          ...renewal,
          contractValue: renewal.contractValue.toString(),
        }))}
        owners={owners}
        currencies={currencies}
        defaultOwnerId={customer.owner.id}
        defaultCurrency={customer.currency}
        canManage={canManage}
      />
    );
  }

  if (section === "risks") {
    const [result, options, riskT] = await Promise.all([
      getRisks(access, { customerId, page }),
      getRiskOptions(access),
      getTranslations({ locale, namespace: "risks" }),
    ]);
    const canManageAccount =
      customer.status === "ACTIVE" &&
      canEditCustomer(access, customer.owner.id);
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
        canManageAccount ||
        (customer.status === "ACTIVE" && risk.ownerId === access.memberId),
    }));
    return (
      <Card className="gap-0 overflow-hidden py-0">
        <div className="waslix-panel-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{riskT("title")}</h2>
            <p className="text-muted-foreground mt-1">{riskT("description")}</p>
          </div>
          {canManageAccount ? (
            <RiskFormDialog
              locale={locale}
              initialOperationKey={randomUUID()}
              lockedCustomerId={customerId}
              customers={options.customers}
              owners={options.owners}
            />
          ) : null}
        </div>
        <RiskList
          risks={risks}
          locale={locale}
          customers={options.customers}
          owners={options.owners}
        />
        <DashboardPagination
          className="border-t p-4"
          currentPage={result.pagination.currentPage}
          totalPages={result.pagination.totalPages}
          getPageHref={(targetPage) =>
            targetPage > 1
              ? `/customers/${customerId}/risks?page=${targetPage}`
              : `/customers/${customerId}/risks`
          }
          labels={{
            summary: riskT("pagination.summary", {
              page: result.pagination.currentPage,
              total: result.pagination.totalPages,
              count: result.pagination.totalCount,
            }),
            previous: riskT("pagination.previous"),
            next: riskT("pagination.next"),
            page: (page) => riskT("pagination.page", { page }),
          }}
        />
      </Card>
    );
  }

  if (section === "timeline") {
    const [timeline, contacts, timelineT] = await Promise.all([
      getCustomerTimeline(access, customerId, { filter, page }),
      getActivityOptions(access, customerId),
      getTranslations({ locale, namespace: "timeline" }),
    ]);
    if (!timeline) notFound();
    const canAddActivity =
      customer.status === "ACTIVE" &&
      canEditCustomer(access, customer.owner.id);
    return (
      <div className="waslix-two-column">
        <Card>
          <div className="waslix-panel-header">
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
                aria-current={timeline.filter === item ? "page" : undefined}
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
          <DashboardPagination
            className="border-t p-4"
            currentPage={timeline.pagination.currentPage}
            totalPages={timeline.pagination.totalPages}
            getPageHref={(targetPage) =>
              `/customers/${customerId}/timeline?${new URLSearchParams({
                filter: timeline.filter ?? "all",
                ...(targetPage > 1 ? { page: String(targetPage) } : {}),
              }).toString()}`
            }
            labels={{
              summary: timelineT("actions.paginationSummary", {
                page: timeline.pagination.currentPage,
                total: timeline.pagination.totalPages,
                count: timeline.pagination.totalCount,
              }),
              previous: timelineT("actions.previous"),
              next: timelineT("actions.next"),
              page: (page) => timelineT("actions.page", { page }),
            }}
          />
        </Card>
        {canAddActivity ? (
          <Card className="waslix-panel-body">
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
    <div className="waslix-two-column">
      <Card>
        <div className="waslix-panel-header">
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
                <Avatar size="lg">
                  <AvatarFallback className="bg-brand text-brand-foreground">
                    {contact.name.trim().charAt(0).toLocaleUpperCase(locale)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-start">
                  <p className="text-start font-medium">
                    <bdi dir="auto">{contact.name}</bdi>
                  </p>
                  <p className="text-muted-foreground truncate text-start text-sm">
                    <bdi dir="auto">{contact.email ?? t("missing")}</bdi>
                  </p>
                  <p className="text-muted-foreground text-start text-xs">
                    <bdi dir="auto">
                      {contact.jobTitle ??
                        t(`contacts.roles.${contact.accountRole}`)}
                    </bdi>
                  </p>
                </div>
                {contact.isPrimary ? (
                  <span className="bg-healthy/10 text-healthy rounded-md px-2 py-1 text-sm font-medium">
                    {t("contacts.primary")}
                  </span>
                ) : contact.status === "INACTIVE" ? (
                  <span className="bg-raised text-muted-foreground rounded-md px-2 py-1 text-sm font-medium">
                    {t("contacts.statuses.INACTIVE")}
                  </span>
                ) : canEdit && contact.status === "ACTIVE" ? (
                  <SetPrimaryContactButton
                    customerId={customerId}
                    contactId={contact.id}
                    locale={locale}
                  />
                ) : null}
                {canEdit ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost">{t("contacts.edit")}</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle>{t("contacts.edit")}</DialogTitle>
                        <DialogDescription>
                          {t("contacts.description")}
                        </DialogDescription>
                      </DialogHeader>
                      <ContactForm
                        customerId={customerId}
                        locale={locale}
                        contact={contact}
                      />
                    </DialogContent>
                  </Dialog>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground p-6">{t("contacts.empty")}</p>
        )}
      </Card>
      {canEdit ? (
        <Card className="waslix-panel-body">
          <h2 className="mb-4 font-semibold">{t("contacts.addTitle")}</h2>
          <ContactForm customerId={customerId} locale={locale} />
        </Card>
      ) : null}
    </div>
  );
}
