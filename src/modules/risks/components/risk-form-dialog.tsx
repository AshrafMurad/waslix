"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { RiskForm } from "./risk-form";

type RiskValue = {
  id: string;
  customerId: string;
  title: string;
  description: string | null;
  type:
    | "USAGE"
    | "ENGAGEMENT"
    | "SUPPORT"
    | "STAKEHOLDER"
    | "ONBOARDING"
    | "RENEWAL"
    | "COMMERCIAL"
    | "OTHER";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ownerId: string;
  targetResolutionDate: string | null;
};

type RiskFormDialogProps = {
  locale: string;
  initialOperationKey: string;
  customers: Array<{ id: string; name: string; ownerId: string }>;
  owners: Array<{ id: string; name: string }>;
  lockedCustomerId?: string;
  value?: RiskValue;
};

export function RiskFormDialog({
  locale,
  initialOperationKey,
  customers,
  owners,
  lockedCustomerId,
  value,
}: RiskFormDialogProps) {
  const t = useTranslations("risks");
  const [open, setOpen] = useState(false);
  const [operationKey, setOperationKey] = useState(initialOperationKey);
  const action = value ? "edit" : "add";

  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen) setOperationKey(crypto.randomUUID());
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          variant={value ? "outline" : "default"}
          size={value ? "sm" : "default"}
        >
          {!value ? <Plus aria-hidden="true" /> : null}
          {t(`actions.${action}`)}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(`actions.${action}`)}</DialogTitle>
          <DialogDescription>
            {t(value ? "dialog.editDescription" : "dialog.addDescription")}
          </DialogDescription>
        </DialogHeader>
        <RiskForm
          key={operationKey}
          locale={locale}
          operationKey={operationKey}
          customers={customers}
          owners={owners}
          lockedCustomerId={lockedCustomerId}
          value={value}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
