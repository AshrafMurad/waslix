import { randomUUID } from "node:crypto";

import { getFormatter, getTranslations } from "next-intl/server";

import { Empty, EmptyDescription } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkspaceAccessContext } from "@/lib/auth/access-context";

import { TaskActionsMenu } from "./task-actions-menu";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueDate: Date | null;
  dueAt: Date | null;
  customerId: string | null;
  ownerId: string;
  customer: { name: string; ownerId: string } | null;
  owner: { user: { name: string } };
};

export async function TaskList({
  access,
  locale,
  tasks,
  owners,
  customers,
  lockedCustomerId,
  timezone,
}: {
  access: WorkspaceAccessContext;
  locale: string;
  tasks: TaskRow[];
  owners: Array<{ id: string; user: { name: string } }>;
  customers: Array<{ id: string; name: string }>;
  lockedCustomerId?: string;
  timezone: string;
}) {
  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: "tasks" }),
    getFormatter({ locale }),
  ]);
  if (!tasks.length) {
    return (
      <Empty>
        <EmptyDescription>{t("empty")}</EmptyDescription>
      </Empty>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-raised hover:bg-raised">
          <TableHead className="min-w-52 px-4">{t("columns.task")}</TableHead>
          <TableHead className="hidden px-4 sm:table-cell">
            {t("columns.status")}
          </TableHead>
          <TableHead className="hidden px-4 md:table-cell">
            {t("columns.due")}
          </TableHead>
          <TableHead className="hidden px-4 lg:table-cell">
            {t("columns.owner")}
          </TableHead>
          <TableHead className="bg-raised sticky end-0 w-24 px-2 text-center">
            {t("columns.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const managesAccount =
            access.role === "ADMIN" ||
            access.role === "CS_MANAGER" ||
            task.customer?.ownerId === access.memberId;
          const canEdit = managesAccount || task.ownerId === access.memberId;
          return (
            <TableRow key={task.id} className="group">
              <TableCell className="px-4 py-3 whitespace-normal">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">
                    <bdi>{task.title}</bdi>
                  </p>
                  <span
                    className={
                      task.priority === "URGENT"
                        ? "text-risk text-xs font-medium"
                        : task.priority === "HIGH"
                          ? "text-attention text-xs font-medium"
                          : "text-muted-foreground text-xs font-medium"
                    }
                  >
                    {t(`priority.${task.priority}`)}
                  </span>
                  <span className="text-muted-foreground text-xs sm:hidden">
                    {t(`status.${task.status}`)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  <bdi>{task.customer?.name ?? t("standalone")}</bdi>
                </p>
                {task.description ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    <bdi>{task.description}</bdi>
                  </p>
                ) : null}
                {task.dueDate || task.dueAt ? (
                  <p className="text-muted-foreground mt-1 text-xs md:hidden">
                    {t("due", {
                      date: format.dateTime(task.dueAt ?? task.dueDate!, {
                        timeZone: task.dueAt ? timezone : "UTC",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        ...(task.dueAt
                          ? { hour: "numeric", minute: "2-digit" }
                          : {}),
                      }),
                    })}
                  </p>
                ) : null}
                <p className="text-muted-foreground mt-1 text-xs lg:hidden">
                  <bdi>{task.owner.user.name}</bdi>
                </p>
              </TableCell>
              <TableCell className="hidden px-4 sm:table-cell">
                {t(`status.${task.status}`)}
              </TableCell>
              <TableCell className="text-muted-foreground hidden px-4 md:table-cell">
                {task.dueDate || task.dueAt
                  ? format.dateTime(task.dueAt ?? task.dueDate!, {
                      timeZone: task.dueAt ? timezone : "UTC",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      ...(task.dueAt
                        ? { hour: "numeric", minute: "2-digit" }
                        : {}),
                    })
                  : t("notSet")}
              </TableCell>
              <TableCell className="hidden px-4 lg:table-cell">
                <bdi>{task.owner.user.name}</bdi>
              </TableCell>
              {canEdit ? (
                <TableCell className="bg-card group-hover:bg-muted/50 sticky end-0 px-2 pt-3 text-center align-top transition-colors">
                  <TaskActionsMenu
                    editTitle={t("actions.edit")}
                    editDescription={t("description")}
                    editLabel={t("actions.edit")}
                    moreLabel={t("actions.more")}
                    locale={locale}
                    operationKey={randomUUID()}
                    statusOperationKey={randomUUID()}
                    cancelOperationKey={randomUUID()}
                    task={{
                      ...task,
                      dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
                    }}
                    lockedCustomerId={lockedCustomerId}
                    owners={owners}
                    customers={customers}
                    defaultOwnerId={task.ownerId}
                    canAssignOwner={managesAccount}
                  />
                </TableCell>
              ) : (
                <TableCell className="bg-card group-hover:bg-muted/50 sticky end-0 px-2 pt-3 text-center align-top transition-colors" />
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
