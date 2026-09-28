"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  importCustomersAction,
  retryCustomerImportAction,
} from "@/modules/imports/actions/import-actions";

type ImportResult = Awaited<ReturnType<typeof importCustomersAction>>;

type DisplayRowError = {
  rowNumber?: number;
  code?: string;
};

type CustomerImportFormProps = {
  labels: {
    file: string;
    mapping: string;
    unmapped: string;
    submit: string;
    validate: string;
    importValidRows: string;
    retry: string;
    pending: string;
    success: string;
    error: string;
    countSuccess: string;
    countFailed: string;
    countSkipped: string;
    row: string;
    columns: Record<string, string>;
    errors: Record<string, string>;
  };
};

const columns = [
  "customer_name",
  "external_key",
  "website",
  "industry",
  "company_size",
  "owner_email",
  "lifecycle_stage_key",
  "contract_value",
  "currency",
  "customer_since",
  "renewal_date",
  "primary_contact_name",
  "primary_contact_email",
  "primary_contact_role",
  "tags",
] as const;

function parseHeaders(text: string) {
  return text
    .split(/\r?\n/, 1)[0]
    .split(",")
    .map((header) => header.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

export function CustomerImportForm({ labels }: CustomerImportFormProps) {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const submit = (
    formData: FormData,
    execute: boolean,
    importValidRows = false,
  ) => {
    formData.set("mapping", JSON.stringify(mapping));
    formData.set("execute", String(execute));
    formData.set("importValidRows", String(importValidRows));
    startTransition(async () => {
      setResult(await importCustomersAction(formData));
    });
  };

  const retry = () => {
    if (!result?.ok || !("validationId" in result)) return;
    const formData = new FormData();
    formData.set("validationId", result.validationId);
    formData.set("importValidRows", "true");
    startTransition(async () => {
      setResult(await retryCustomerImportAction(formData));
    });
  };

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        submit(formData, true, false);
      }}
    >
      <label className="block space-y-2 text-sm">
        <span>{labels.file}</span>
        <Input
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            const parsed = parseHeaders(await file.text());
            setHeaders(parsed);
            setMapping(
              Object.fromEntries(
                columns.map((column) => [
                  column,
                  parsed.find((header) => header.toLowerCase() === column) ??
                    "",
                ]),
              ),
            );
          }}
        />
      </label>
      {headers.length ? (
        <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
          <p className="text-sm font-medium sm:col-span-2">{labels.mapping}</p>
          {columns.map((column) => (
            <label key={column} className="grid gap-1 text-sm">
              <span>{labels.columns[column]}</span>
              <select
                className="border-input bg-background rounded-md border px-3 py-2"
                value={mapping[column] ?? ""}
                onChange={(event) =>
                  setMapping((current) => ({
                    ...current,
                    [column]: event.target.value,
                  }))
                }
              >
                <option value="">{labels.unmapped}</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) submit(new FormData(form), false);
          }}
        >
          {isPending ? labels.pending : labels.validate}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? labels.pending : labels.submit}
        </Button>
        {result?.ok && "validationId" in result && result.failedRows ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (form) submit(new FormData(form), true, true);
            }}
          >
            {labels.importValidRows}
          </Button>
        ) : null}
        {result?.ok && "validationId" in result ? (
          <Button
            type="button"
            variant="outline"
            onClick={retry}
            disabled={isPending}
          >
            {labels.retry}
          </Button>
        ) : null}
      </div>
      {result ? (
        <div className="rounded-md border p-4 text-sm" role="status">
          {result.ok ? (
            <div className="space-y-3">
              <p>
                {labels.success} {result.succeededRows}/{result.totalRows}
              </p>
              <p>
                {labels.countSuccess}: {result.succeededRows} ·{" "}
                {labels.countFailed}: {result.failedRows} · {labels.countSkipped}: {result.skippedRows}
              </p>
              {"errors" in result && result.errors.length ? (
                <ul className="text-risk space-y-1">
                  {(result.errors as DisplayRowError[]).map((error, index) => (
                    <li key={`${error.rowNumber}-${error.code}-${index}`}>
                      {labels.row} {error.rowNumber}:{" "}
                      {labels.errors[error.code ?? ""] ?? error.code}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-risk">{`${labels.error} ${result.code}`}</p>
          )}
        </div>
      ) : null}
    </form>
  );
}
