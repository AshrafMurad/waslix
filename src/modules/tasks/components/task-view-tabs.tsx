"use client";

import { useOptimistic, useTransition } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/navigation";

const taskFilters = ["my", "team", "overdue", "completed"] as const;
type TaskFilter = (typeof taskFilters)[number];

export function TaskViewTabs({
  activeFilter,
  label,
  labels,
}: {
  activeFilter: TaskFilter;
  label: string;
  labels: Record<TaskFilter, string>;
}) {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useOptimistic(activeFilter);
  const [pending, startTransition] = useTransition();

  function changeFilter(value: string) {
    if (!taskFilters.includes(value as TaskFilter)) return;
    const filter = value as TaskFilter;
    startTransition(() => {
      setSelectedFilter(filter);
      router.replace(`/tasks?filter=${filter}`, { scroll: false });
    });
  }

  return (
    <Tabs
      value={selectedFilter}
      onValueChange={changeFilter}
      className="w-full"
    >
      <TabsList
        aria-label={label}
        className="mx-4 mt-4 mb-2 h-auto max-w-[calc(100%-2rem)] justify-start gap-1 overflow-x-auto rtl:me-auto"
      >
        {taskFilters.map((filter) => (
          <TabsTrigger
            key={filter}
            value={filter}
            className="shrink-0 px-4"
            aria-busy={pending && selectedFilter === filter}
          >
            {labels[filter]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
