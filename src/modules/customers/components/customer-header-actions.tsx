"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ActivityForm } from "@/modules/activities/components/activity-form";
import { RiskFormDialog } from "@/modules/risks/components/risk-form-dialog";
import { TaskForm } from "@/modules/tasks/components/task-form";

type CustomerHeaderActionsProps = {
  locale: string;
  customerId: string;
  canManage: boolean;
  contacts: Array<{ id: string; name: string }>;
  taskOwners: Array<{ id: string; user: { name: string } }>;
  taskCustomers: Array<{ id: string; name: string }>;
  riskOwners: Array<{ id: string; name: string }>;
  riskCustomers: Array<{ id: string; name: string; ownerId: string }>;
  defaultOwnerId: string;
  canAssignOwner: boolean;
};

export function CustomerHeaderActions({
  locale,
  customerId,
  canManage,
  contacts,
  taskOwners,
  taskCustomers,
  riskOwners,
  riskCustomers,
  defaultOwnerId,
  canAssignOwner,
}: CustomerHeaderActionsProps) {
  const t = useTranslations("customers");
  const [activityOpen, setActivityOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  if (!canManage) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">{t("quickActions.addActivity")}</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("quickActions.addActivity")}</DialogTitle>
            <DialogDescription>
              {t("quickActions.addActivityDescription")}
            </DialogDescription>
          </DialogHeader>
          <ActivityForm
            key={activityOpen ? "open" : "closed"}
            customerId={customerId}
            locale={locale}
            operationKey={crypto.randomUUID()}
            contacts={contacts}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">{t("quickActions.createTask")}</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("quickActions.createTask")}</DialogTitle>
            <DialogDescription>
              {t("quickActions.createTaskDescription")}
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            key={taskOpen ? "open" : "closed"}
            locale={locale}
            operationKey={crypto.randomUUID()}
            lockedCustomerId={customerId}
            owners={taskOwners}
            customers={taskCustomers}
            defaultOwnerId={defaultOwnerId}
            canAssignOwner={canAssignOwner}
            onSuccess={() => setTaskOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <RiskFormDialog
        locale={locale}
        initialOperationKey={crypto.randomUUID()}
        customers={riskCustomers}
        owners={riskOwners}
        lockedCustomerId={customerId}
      />
    </div>
  );
}
