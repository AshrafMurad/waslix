"use client";

import { useActionState, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { MoreHorizontal, Pencil, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { RiskFormDialog } from "./risk-form-dialog";

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
  const format = useFormatter();
  const [editOpen, setEditOpen] = useState(false);
  const [editOperationKey, setEditOperationKey] = useState(
    `${risk.id}:edit:${risk.updatedAt}`,
  );
  const [manageOpen, setManageOpen] = useState(false);
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
  const targetDate = risk.targetResolutionDate
    ? format.dateTime(new Date(`${risk.targetResolutionDate}T00:00:00.000Z`), {
        dateStyle: "medium",
        timeZone: "UTC",
      })
    : t("missingTarget");
  return (
    <TableRow>
      <TableCell className="w-full min-w-52 whitespace-normal sm:min-w-64">
        <div className="text-start">
          <Link
            href={`/customers/${risk.customerId}/risks`}
            className="font-semibold hover:underline"
          >
            <bdi>{risk.title}</bdi>
          </Link>
          <p className="text-muted-foreground mt-1 text-xs">
            <bdi>{risk.customerName}</bdi>
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
          <span
            className={
              risk.severity === "CRITICAL" || risk.severity === "HIGH"
                ? "text-risk bg-risk/10 rounded-md px-2 py-1 text-xs font-medium"
                : "text-attention bg-attention/10 rounded-md px-2 py-1 text-xs font-medium"
            }
          >
            {t(`severity.${risk.severity}`)}
          </span>
          <span className="bg-raised rounded-md px-2 py-1 text-xs font-medium">
            {t(`status.${risk.status}`)}
          </span>
        </div>
        {risk.description ? (
          <p className="mt-2 line-clamp-2 text-start text-sm">
            <bdi>{risk.description}</bdi>
          </p>
        ) : null}
        {risk.resolutionNote ? (
          <p className="text-muted-foreground mt-2 text-start text-xs">
            {t.rich("resolution", {
              note: () => <bdi>{risk.resolutionNote}</bdi>,
            })}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-2 text-xs sm:hidden">
          {t("target", { date: targetDate })}
        </p>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
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
      <TableCell className="hidden sm:table-cell">
        <span className="bg-raised rounded-md px-2 py-1 text-xs font-medium">
          {t(`status.${risk.status}`)}
        </span>
      </TableCell>
      <TableCell className="hidden text-start lg:table-cell">
        <bdi>{risk.ownerName}</bdi>
      </TableCell>
      <TableCell className="text-muted-foreground hidden text-xs whitespace-normal xl:table-cell">
        {risk.mitigationCount ? t("mitigation.active") : t("mitigation.none")}
      </TableCell>
      <TableCell className="w-0 align-top whitespace-normal md:align-middle">
        {risk.canManage ? (
          <>
            <div className="flex justify-start md:justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("dialog.actions")}
                  >
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {risk.status !== "RESOLVED" ? (
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditOperationKey(crypto.randomUUID());
                        setEditOpen(true);
                      }}
                    >
                      <Pencil aria-hidden="true" />
                      {t("actions.edit")}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onSelect={() => {
                      setManageOpen(true);
                    }}
                  >
                    <SlidersHorizontal aria-hidden="true" />
                    {t("dialog.manage")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {risk.status !== "RESOLVED" ? (
              <RiskFormDialog
                key={editOperationKey}
                locale={locale}
                initialOperationKey={editOperationKey}
                customers={customers}
                owners={owners}
                value={risk}
                open={editOpen}
                onOpenChange={setEditOpen}
                hideTrigger
              />
            ) : null}
            <Dialog open={manageOpen} onOpenChange={setManageOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle dir="auto">{risk.title}</DialogTitle>
                  <DialogDescription>
                    {t("dialog.manageDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-raised grid gap-3 rounded-md p-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("fields.owner")}
                    </p>
                    <p className="mt-1 font-medium" dir="auto">
                      {risk.ownerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("fields.targetDate")}
                    </p>
                    <p className="mt-1 font-medium">{targetDate}</p>
                  </div>
                </div>
                {risk.status !== "RESOLVED" ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <form action={mitigationAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="riskId" value={risk.id} />
                        <input
                          type="hidden"
                          name="customerId"
                          value={risk.customerId}
                        />
                        <input
                          type="hidden"
                          name="operationKey"
                          value={`${risk.id}:mitigation`}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          disabled={
                            mitigationPending || risk.mitigationCount > 0
                          }
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
                          <input
                            type="hidden"
                            name="status"
                            value="MONITORING"
                          />
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
                    </div>
                    <form action={statusAction} className="space-y-3">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="riskId" value={risk.id} />
                      <input
                        type="hidden"
                        name="customerId"
                        value={risk.customerId}
                      />
                      <input type="hidden" name="status" value="RESOLVED" />
                      <input
                        type="hidden"
                        name="operationKey"
                        value={`${risk.id}:resolve:${risk.updatedAt}`}
                      />
                      <Field data-invalid={Boolean(resolutionError)}>
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
                      <Button type="submit" disabled={statusPending}>
                        {statusPending ? (
                          <Spinner aria-label={t("actions.saving")} />
                        ) : null}
                        {t("actions.resolve")}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <form action={statusAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="riskId" value={risk.id} />
                    <input
                      type="hidden"
                      name="customerId"
                      value={risk.customerId}
                    />
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
                      disabled={statusPending}
                    >
                      {statusPending ? (
                        <Spinner aria-label={t("actions.saving")} />
                      ) : null}
                      {t("actions.reopen")}
                    </Button>
                  </form>
                )}
                {statusState.status === "error" ||
                mitigationState.status === "error" ? (
                  <p role="alert" className="text-risk text-sm">
                    {t("feedback.failed")}
                  </p>
                ) : null}
              </DialogContent>
            </Dialog>
          </>
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
    <Table dir={props.locale === "ar" ? "rtl" : "ltr"}>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.risk")}</TableHead>
          <TableHead className="hidden sm:table-cell">
            {t("columns.severity")}
          </TableHead>
          <TableHead className="hidden sm:table-cell">
            {t("columns.status")}
          </TableHead>
          <TableHead className="hidden lg:table-cell">
            {t("columns.owner")}
          </TableHead>
          <TableHead className="hidden xl:table-cell">
            {t("columns.mitigation")}
          </TableHead>
          <TableHead className="text-start md:text-center">
            {t("columns.actions")}
          </TableHead>
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
