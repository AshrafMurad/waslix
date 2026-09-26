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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  status: "OPEN" | "MONITORING" | "RESOLVED";
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
  const resolutionError = statusState.fieldErrors?.resolutionNote
    ? t("validation.required")
    : null;
  return (
    <TableRow>
      <TableCell className="min-w-64 whitespace-normal">
        <Link
          href={`/customers/${risk.customerId}/risks`}
          className="font-semibold hover:underline"
          dir="auto"
        >
          {risk.title}
        </Link>
        <p className="text-muted-foreground mt-1 text-xs" dir="auto">
          {risk.customerName}
        </p>
        {risk.description ? (
          <p className="mt-2 line-clamp-2 text-sm" dir="auto">
            {risk.description}
          </p>
        ) : null}
        {risk.resolutionNote ? (
          <p className="text-muted-foreground mt-2 text-xs" dir="auto">
            {t("resolution", { note: risk.resolutionNote })}
          </p>
        ) : null}
      </TableCell>
      <TableCell>
        <span
          className={
            risk.severity === "CRITICAL" || risk.severity === "HIGH"
              ? "text-risk font-medium"
              : "text-attention font-medium"
          }
        >
          {t(`severity.${risk.severity}`)}
        </span>
      </TableCell>
      <TableCell>{t(`status.${risk.status}`)}</TableCell>
      <TableCell dir="auto">{risk.ownerName}</TableCell>
      <TableCell className="text-muted-foreground text-xs whitespace-normal">
        {risk.mitigationCount ? t("mitigation.active") : t("mitigation.none")}
      </TableCell>
      <TableCell className="min-w-72 whitespace-normal">
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
        {risk.canManage && risk.status !== "RESOLVED" ? (
          <div className="mt-2 flex flex-wrap gap-2">
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
                {mitigationPending ? (
                  <Spinner aria-label={t("actions.saving")} />
                ) : null}
                {t("actions.mitigation")}
              </Button>
            </form>
            {risk.status === "OPEN" ? (
              <form action={statusAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="riskId" value={risk.id} />
                <input
                  type="hidden"
                  name="customerId"
                  value={risk.customerId}
                />
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
                  {statusPending ? (
                    <Spinner aria-label={t("actions.saving")} />
                  ) : null}
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
              <Field
                data-invalid={Boolean(resolutionError)}
                className="min-w-56 flex-1 gap-1"
              >
                <FieldLabel htmlFor={`risk-resolution-${risk.id}`}>
                  {t("fields.resolutionNote")}
                </FieldLabel>
                <Input
                  id={`risk-resolution-${risk.id}`}
                  name="resolutionNote"
                  maxLength={10000}
                  dir="auto"
                  aria-required="true"
                  aria-invalid={Boolean(resolutionError)}
                  aria-describedby={
                    resolutionError
                      ? `risk-resolution-${risk.id}-error`
                      : undefined
                  }
                />
                <FieldError id={`risk-resolution-${risk.id}-error`}>
                  {resolutionError}
                </FieldError>
              </Field>
              <Button type="submit" size="sm" disabled={statusPending}>
                {statusPending ? (
                  <Spinner aria-label={t("actions.saving")} />
                ) : null}
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
              {statusPending ? (
                <Spinner aria-label={t("actions.saving")} />
              ) : null}
              {t("actions.reopen")}
            </Button>
          </form>
        ) : null}
        {statusState.status === "error" ||
        mitigationState.status === "error" ? (
          <p role="alert" className="text-risk text-sm">
            {t("feedback.failed")}
          </p>
        ) : null}
      </TableCell>
    </TableRow>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.risk")}</TableHead>
          <TableHead>{t("columns.severity")}</TableHead>
          <TableHead>{t("columns.status")}</TableHead>
          <TableHead>{t("columns.owner")}</TableHead>
          <TableHead>{t("columns.mitigation")}</TableHead>
          <TableHead>{t("columns.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.risks.map((risk) => (
          <RiskRow
            key={risk.id}
            risk={risk}
            locale={props.locale}
            customers={props.customers}
            owners={props.owners}
          />
        ))}
      </TableBody>
    </Table>
  );
}
