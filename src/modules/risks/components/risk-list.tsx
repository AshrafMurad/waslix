"use client";

import { useActionState } from "react";
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
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

import {
  changeRiskStatusAction,
  createRiskMitigationAction,
  type RiskActionState,
} from "../actions/risk-actions";
import { RiskForm } from "./risk-form";

const initial: RiskActionState = { status: "idle" };

type RiskRowValue = {
  id: string;
  customerId: string;
  title: string;
  description: string | null;
  type: string;
  severity: string;
  status: string;
  targetResolutionDate: string | null;
  resolutionNote: string | null;
  ownerId: string;
  customerName: string;
  ownerName: string;
  mitigationCount: number;
  canManage: boolean;
  updatedAt: string;
};

function RiskRow({
  risk,
  locale,
  customers,
  owners,
}: {
  risk: RiskRowValue;
  locale: string;
  customers: Array<{ id: string; name: string; ownerId: string }>;
  owners: Array<{ id: string; name: string }>;
}) {
  const t = useTranslations("risks");
  const [statusState, statusAction, statusPending] = useActionState(
    changeRiskStatusAction,
    initial,
  );
  const [mitigationState, mitigationAction, mitigationPending] = useActionState(
    createRiskMitigationAction,
    initial,
  );
  return (
    <li className="space-y-4 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/customers/${risk.customerId}/risks`}
              className="font-semibold hover:underline"
              dir="auto"
            >
              {risk.title}
            </Link>
            <span
              className={
                risk.severity === "CRITICAL" || risk.severity === "HIGH"
                  ? "text-risk text-xs font-medium"
                  : "text-attention text-xs font-medium"
              }
            >
              {t(`severity.${risk.severity}`)}
            </span>
            <span className="text-muted-foreground text-xs">
              {t(`status.${risk.status}`)}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm" dir="auto">
            {risk.customerName} · {risk.ownerName}
          </p>
          {risk.description ? (
            <p className="mt-2 text-sm" dir="auto">
              {risk.description}
            </p>
          ) : null}
          {risk.resolutionNote ? (
            <p className="text-muted-foreground mt-2 text-sm">
              {t("resolution", { note: risk.resolutionNote })}
            </p>
          ) : null}
          <p className="text-muted-foreground mt-2 text-xs">
            {risk.mitigationCount
              ? t("mitigation.active")
              : t("mitigation.none")}
          </p>
        </div>
        {risk.canManage && risk.status !== "RESOLVED" ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {t("actions.edit")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{t("actions.edit")}</DialogTitle>
                <DialogDescription>{t("description")}</DialogDescription>
              </DialogHeader>
              <RiskForm
                locale={locale}
                operationKey={`${risk.id}:edit:${risk.updatedAt}`}
                customers={customers}
                owners={owners}
                value={risk}
              />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
      {risk.canManage && risk.status !== "RESOLVED" ? (
        <div className="flex flex-wrap gap-2">
          <form action={mitigationAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="riskId" value={risk.id} />
            <input type="hidden" name="customerId" value={risk.customerId} />
            <input
              type="hidden"
              name="operationKey"
              value={`${risk.id}:mitigation`}
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={mitigationPending || risk.mitigationCount > 0}
            >
              {t("actions.mitigation")}
            </Button>
          </form>
          {risk.status === "OPEN" ? (
            <form action={statusAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="riskId" value={risk.id} />
              <input type="hidden" name="customerId" value={risk.customerId} />
              <input type="hidden" name="status" value="MONITORING" />
              <input type="hidden" name="resolutionNote" value="" />
              <input
                type="hidden"
                name="operationKey"
                value={`${risk.id}:monitor:${risk.updatedAt}`}
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={statusPending}
              >
                {t("actions.monitor")}
              </Button>
            </form>
          ) : null}
          <form action={statusAction} className="flex flex-1 flex-wrap gap-2">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="riskId" value={risk.id} />
            <input type="hidden" name="customerId" value={risk.customerId} />
            <input type="hidden" name="status" value="RESOLVED" />
            <input
              type="hidden"
              name="operationKey"
              value={`${risk.id}:resolve:${risk.updatedAt}`}
            />
            <Input
              name="resolutionNote"
              required
              maxLength={10000}
              placeholder={t("fields.resolutionNote")}
              className="min-w-56 flex-1"
            />
            <Button type="submit" size="sm" disabled={statusPending}>
              {t("actions.resolve")}
            </Button>
          </form>
        </div>
      ) : risk.canManage ? (
        <form action={statusAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="riskId" value={risk.id} />
          <input type="hidden" name="customerId" value={risk.customerId} />
          <input type="hidden" name="status" value="OPEN" />
          <input type="hidden" name="resolutionNote" value="" />
          <input
            type="hidden"
            name="operationKey"
            value={`${risk.id}:reopen:${risk.updatedAt}`}
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={statusPending}
          >
            {t("actions.reopen")}
          </Button>
        </form>
      ) : null}
      {statusState.status === "error" || mitigationState.status === "error" ? (
        <p role="alert" className="text-risk text-sm">
          {t(
            statusState.code === "RISK_RESOLUTION_NOTE_REQUIRED"
              ? "feedback.noteRequired"
              : "feedback.failed",
          )}
        </p>
      ) : null}
    </li>
  );
}

export function RiskList(props: {
  risks: RiskRowValue[];
  locale: string;
  customers: Array<{ id: string; name: string; ownerId: string }>;
  owners: Array<{ id: string; name: string }>;
}) {
  const t = useTranslations("risks");
  if (!props.risks.length)
    return <p className="text-muted-foreground p-6">{t("empty")}</p>;
  return (
    <ul className="divide-y">
      {props.risks.map((risk) => (
        <RiskRow
          key={risk.id}
          risk={risk}
          locale={props.locale}
          customers={props.customers}
          owners={props.owners}
        />
      ))}
    </ul>
  );
}
