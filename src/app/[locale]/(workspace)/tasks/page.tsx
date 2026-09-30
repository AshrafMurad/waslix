import { randomUUID } from "node:crypto";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
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
    getTasks(access, { filter: first(raw.filter), cursor: first(raw.cursor) }),
    getTaskOptions(access),
    getTranslations({ locale, namespace: "tasks" }),
  ]);
  const visibleOwners =
    access.role === "CSM"
      ? options.owners.filter((owner) => owner.id === access.memberId)
      : options.owners;
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
      {result.nextCursor ? (
        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link
              href={`/tasks?filter=${result.filter}&cursor=${result.nextCursor}`}
            >
              {t("pagination.next")}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
