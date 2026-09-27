"use client";

import { useTransition } from "react";

import { useRouter } from "@/i18n/navigation";

type AnalyticsFiltersProps = {
  filters: { period: string; owner?: string; lifecycle?: string };
  owners: Array<{ id: string; name: string }>;
  lifecycleStages: Array<{ id: string; name: string }>;
  labels: {
    period: string;
    owner: string;
    lifecycle: string;
    all: string;
    days30: string;
    days90: string;
    days180: string;
  };
};

export function AnalyticsFilters({
  filters,
  labels,
  lifecycleStages,
  owners,
}: AnalyticsFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(next: Record<string, string>) {
    const params = new URLSearchParams();
    params.set("period", next.period);
    if (next.owner) params.set("owner", next.owner);
    if (next.lifecycle) params.set("lifecycle", next.lifecycle);
    startTransition(() => router.replace(`/analytics?${params.toString()}`));
  }

  const controlClass =
    "bg-surface min-h-10 rounded-md border px-3 text-sm disabled:opacity-60";

  return (
    <div className="flex flex-wrap gap-3" aria-busy={isPending}>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">{labels.period}</span>
        <select
          className={controlClass}
          value={filters.period}
          onChange={(event) =>
            update({ ...filters, period: event.target.value })
          }
          disabled={isPending}
        >
          <option value="30">{labels.days30}</option>
          <option value="90">{labels.days90}</option>
          <option value="180">{labels.days180}</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">{labels.owner}</span>
        <select
          className={controlClass}
          value={filters.owner ?? ""}
          onChange={(event) =>
            update({ ...filters, owner: event.target.value })
          }
          disabled={isPending}
        >
          <option value="">{labels.all}</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">{labels.lifecycle}</span>
        <select
          className={controlClass}
          value={filters.lifecycle ?? ""}
          onChange={(event) =>
            update({ ...filters, lifecycle: event.target.value })
          }
          disabled={isPending}
        >
          <option value="">{labels.all}</option>
          {lifecycleStages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
