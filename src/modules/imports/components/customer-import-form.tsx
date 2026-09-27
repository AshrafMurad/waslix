"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importCustomersAction } from "@/modules/imports/actions/import-actions";

type ImportResult = Awaited<ReturnType<typeof importCustomersAction>>;

type CustomerImportFormProps = {
  labels: {
    file: string;
    submit: string;
    pending: string;
    success: string;
    error: string;
  };
};

export function CustomerImportForm({ labels }: CustomerImportFormProps) {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        startTransition(async () => {
          setResult(await importCustomersAction(formData));
        });
      }}
    >
      <label className="block space-y-2 text-sm">
        <span>{labels.file}</span>
        <Input name="file" type="file" accept=".csv,text/csv" required />
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? labels.pending : labels.submit}
      </Button>
      {result ? (
        <div className="rounded-md border p-4 text-sm" role="status">
          {result.ok ? (
            <p>
              {labels.success} {result.succeededRows}/{result.totalRows}
            </p>
          ) : (
            <p className="text-risk">{`${labels.error} ${result.code}`}</p>
          )}
        </div>
      ) : null}
    </form>
  );
}
