import { randomUUID } from "node:crypto";

import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { GoalForm } from "./goal-form";

type GoalSectionProps = {
  locale: string;
  customerId: string;
  canEdit: boolean;
  owners: Array<{ id: string; name: string }>;
  defaultOwnerId: string;
  goals: Array<{
    id: string;
    title: string;
    description: string | null;
    progress: number;
    status: string;
    targetDate: Date | null;
    owner: { id: string; user: { name: string } };
  }>;
};

export async function GoalSection(props: GoalSectionProps) {
  const t = await getTranslations({ locale: props.locale, namespace: "goals" });
  const date = new Intl.DateTimeFormat(props.locale, {
    calendar: "gregory",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 border-b p-5">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
        {props.canEdit ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button>{t("actions.add")}</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("actions.add")}</DialogTitle>
                <DialogDescription>{t("description")}</DialogDescription>
              </DialogHeader>
              <GoalForm {...props} operationKey={randomUUID()} />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
      {props.goals.length ? (
        <ul className="divide-y">
          {props.goals.map((goal) => (
            <li
              key={goal.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium" dir="auto">
                    {goal.title}
                  </h3>
                  <span className="bg-raised rounded-md px-2 py-1 text-xs">
                    {t(`status.${goal.status}`)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("meta", {
                    owner: goal.owner.user.name,
                    target: goal.targetDate
                      ? date.format(goal.targetDate)
                      : t("noTarget"),
                  })}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div
                    className="bg-raised h-2 flex-1 overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={goal.progress}
                  >
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <span className="text-sm tabular-nums">
                    {new Intl.NumberFormat(props.locale, {
                      style: "percent",
                    }).format(goal.progress / 100)}
                  </span>
                </div>
              </div>
              {props.canEdit ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">{t("actions.edit")}</Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t("actions.edit")}</DialogTitle>
                      <DialogDescription>{t("description")}</DialogDescription>
                    </DialogHeader>
                    <GoalForm
                      {...props}
                      operationKey={randomUUID()}
                      goal={{ ...goal, ownerId: goal.owner.id }}
                    />
                  </DialogContent>
                </Dialog>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground p-6">{t("empty")}</p>
      )}
    </Card>
  );
}
