import { randomUUID } from "node:crypto";

import { getFormatter, getTranslations } from "next-intl/server";

import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { WorkspaceAccessContext } from "@/lib/auth/access-context";

import { TaskForm } from "./task-form";
import { TaskStatusButton } from "./task-status-button";

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
    <ul className="divide-y">
      {tasks.map((task) => {
        const managesAccount =
          access.role === "ADMIN" ||
          access.role === "CS_MANAGER" ||
          task.customer?.ownerId === access.memberId;
        const canEdit = managesAccount || task.ownerId === access.memberId;
        return (
          <li
            key={task.id}
            className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center"
          >
            <TaskStatusButton
              taskId={task.id}
              customerId={task.customerId}
              locale={locale}
              status={task.status}
              operationKey={randomUUID()}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium" dir="auto">
                  {task.title}
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
                <span className="text-muted-foreground text-xs">
                  {t(`status.${task.status}`)}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm" dir="auto">
                {task.customer?.name ?? t("standalone")} ·{" "}
                {task.owner.user.name}
              </p>
              {task.dueDate || task.dueAt ? (
                <p className="text-muted-foreground mt-1 text-xs">
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
            </div>
            {canEdit ? (
              <div className="flex items-center gap-2">
                {task.status !== "COMPLETED" && task.status !== "CANCELLED" ? (
                  <TaskStatusButton
                    taskId={task.id}
                    customerId={task.customerId}
                    locale={locale}
                    status={task.status}
                    operationKey={randomUUID()}
                    targetStatus="CANCELLED"
                  />
                ) : null}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost">{t("actions.edit")}</Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>{t("actions.edit")}</DialogTitle>
                      <DialogDescription>{t("description")}</DialogDescription>
                    </DialogHeader>
                    <TaskForm
                      locale={locale}
                      operationKey={randomUUID()}
                      task={{
                        ...task,
                        dueDate:
                          task.dueDate?.toISOString().slice(0, 10) ?? null,
                      }}
                      lockedCustomerId={lockedCustomerId}
                      owners={owners}
                      customers={customers}
                      defaultOwnerId={task.ownerId}
                      canAssignOwner={managesAccount}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
