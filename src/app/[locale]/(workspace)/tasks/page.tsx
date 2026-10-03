import { randomUUID } from "node:crypto";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { DashboardPagination } from "@/components/dashboard/dashboard-pagination";
import { isLocale } from "@/i18n/config";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { TaskFormDialog } from "@/modules/tasks/components/task-form-dialog";
import { TaskList } from "@/modules/tasks/components/task-list";
import { TaskViewTabs } from "@/modules/tasks/components/task-view-tabs";
import { getTaskOptions } from "@/modules/tasks/queries/get-task-options";
import { getTasks } from "@/modules/tasks/queries/get-tasks";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TasksPage({
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
    getTasks(access, { filter: first(raw.filter), page: first(raw.page) }),
    getTaskOptions(access),
    getTranslations({ locale, namespace: "tasks" }),
  ]);
  const visibleOwners =
    access.role === "CSM"
      ? options.owners.filter((owner) => owner.id === access.memberId)
      : options.owners;
  function getPageHref(page: number) {
    const params = new URLSearchParams({
      filter: result.filter,
      ...(page > 1 ? { page: String(page) } : {}),
    });
    return `/tasks?${params.toString()}`;
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
        {access.role !== "VIEWER" ? (
          <TaskFormDialog
            mode="create"
            title={t("actions.add")}
            description={t("description")}
            triggerLabel={t("actions.add")}
            locale={locale}
            operationKey={randomUUID()}
            owners={visibleOwners}
            customers={options.customers}
            defaultOwnerId={access.memberId}
            canAssignOwner={access.role !== "CSM"}
          />
        ) : null}
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <TaskViewTabs
          activeFilter={result.filter}
          label={t("filters.label")}
          labels={{
            my: t("filters.my"),
            team: t("filters.team"),
            overdue: t("filters.overdue"),
            completed: t("filters.completed"),
          }}
        />
        <TaskList
          access={access}
          locale={locale}
          tasks={result.tasks}
          owners={options.owners}
          customers={options.customers}
          timezone={result.timezone}
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
