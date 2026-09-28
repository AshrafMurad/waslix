"use client";

import { type ReactNode, useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  return (
    <div className="flex flex-wrap gap-3" aria-busy={isPending}>
      <FilterSelect
        label={labels.period}
        value={filters.period}
        onValueChange={(value) => update({ ...filters, period: value })}
        disabled={isPending}
      >
        <SelectItem value="30">{labels.days30}</SelectItem>
        <SelectItem value="90">{labels.days90}</SelectItem>
        <SelectItem value="180">{labels.days180}</SelectItem>
      </FilterSelect>
      <FilterSelect
        label={labels.owner}
        value={filters.owner ?? "all"}
        onValueChange={(value) =>
          update({ ...filters, owner: value === "all" ? "" : value })
        }
        disabled={isPending}
      >
        <SelectItem value="all">{labels.all}</SelectItem>
        {owners.map((owner) => (
          <SelectItem key={owner.id} value={owner.id}>
            {owner.name}
          </SelectItem>
        ))}
      </FilterSelect>
      <FilterSelect
        label={labels.lifecycle}
        value={filters.lifecycle ?? "all"}
        onValueChange={(value) =>
          update({ ...filters, lifecycle: value === "all" ? "" : value })
        }
        disabled={isPending}
      >
        <SelectItem value="all">{labels.all}</SelectItem>
        {lifecycleStages.map((stage) => (
          <SelectItem key={stage.id} value={stage.id}>
            {stage.name}
          </SelectItem>
        ))}
      </FilterSelect>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  children,
  disabled,
  onValueChange,
}: {
  label: string;
  value: string;
  children: ReactNode;
  disabled: boolean;
  onValueChange: (value: string) => void;
}) {
  return (
    <label className="text-muted-foreground grid gap-1 text-xs">
      {label}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="bg-surface min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </label>
  );
}
