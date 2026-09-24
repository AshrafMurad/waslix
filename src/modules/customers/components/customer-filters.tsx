"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";

type FilterValues = {
  query: string;
  lifecycle: string;
  owner: string;
  status: string;
  sort: string;
};

type FilterName = Exclude<keyof FilterValues, "query">;

export function CustomerFilters({
  filters,
  labels,
  lifecycleStages,
  owners,
}: {
  filters: FilterValues;
  labels: {
    search: string;
    loading: string;
    lifecycle: string;
    allLifecycle: string;
    owner: string;
    allOwners: string;
    status: string;
    active: string;
    archived: string;
    allStatuses: string;
    sort: string;
    nameAsc: string;
    nameDesc: string;
    filterTitle: string;
    filterDescription: string;
    done: string;
  };
  lifecycleStages: Array<{ id: string; name: string }>;
  owners: Array<{ id: string; user: { name: string } }>;
}) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [values, setValues] = useState(filters);
  const [pending, startTransition] = useTransition();

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  function navigate(nextValues: FilterValues) {
    const params = new URLSearchParams();
    const query = nextValues.query.trim();
    if (query) params.set("query", query);
    if (nextValues.lifecycle) params.set("lifecycle", nextValues.lifecycle);
    if (nextValues.owner) params.set("owner", nextValues.owner);
    if (nextValues.status) params.set("status", nextValues.status);
    if (nextValues.sort) params.set("sort", nextValues.sort);

    startTransition(() => {
      router.replace(`/customers?${params.toString()}`, { scroll: false });
    });
  }

  function updateSelect(name: FilterName, value: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    navigate(nextValues);
  }

  function updateQuery(query: string) {
    const nextValues = { ...values, query };
    setValues(nextValues);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => navigate(nextValues), 350);
  }

  function renderSearch(compact = false) {
    return (
      <label
        className={
          compact
            ? "min-w-0 flex-1"
            : "text-muted-foreground grid gap-1 text-xs"
        }
      >
        <span className={compact ? "sr-only" : undefined}>{labels.search}</span>
        <span className="relative block">
          {pending ? (
            <Spinner
              aria-label={labels.loading}
              className="text-muted-foreground absolute start-3 top-2.5 z-10"
            />
          ) : (
            <Search
              aria-hidden="true"
              className="text-muted-foreground absolute start-3 top-2.5 size-4"
            />
          )}
          <Input
            name="query"
            value={values.query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={labels.search}
            className="ps-10"
            dir="auto"
          />
        </span>
      </label>
    );
  }

  function renderFilterControls() {
    return (
      <>
        <FilterSelect
          name="lifecycle"
          label={labels.lifecycle}
          value={values.lifecycle}
          onValueChange={updateSelect}
        >
          <SelectItem value="all">{labels.allLifecycle}</SelectItem>
          {lifecycleStages.map((stage) => (
            <SelectItem key={stage.id} value={stage.id}>
              {stage.name}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect
          name="owner"
          label={labels.owner}
          value={values.owner}
          onValueChange={updateSelect}
        >
          <SelectItem value="all">{labels.allOwners}</SelectItem>
          {owners.map((owner) => (
            <SelectItem key={owner.id} value={owner.id}>
              {owner.user.name}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect
          name="status"
          label={labels.status}
          value={values.status}
          onValueChange={updateSelect}
        >
          <SelectItem value="ACTIVE">{labels.active}</SelectItem>
          <SelectItem value="ARCHIVED">{labels.archived}</SelectItem>
          <SelectItem value="ALL">{labels.allStatuses}</SelectItem>
        </FilterSelect>
        <FilterSelect
          name="sort"
          label={labels.sort}
          value={values.sort}
          onValueChange={updateSelect}
        >
          <SelectItem value="asc">{labels.nameAsc}</SelectItem>
          <SelectItem value="desc">{labels.nameDesc}</SelectItem>
        </FilterSelect>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b p-4 md:hidden">
        {renderSearch(true)}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={labels.filterTitle}
            >
              <SlidersHorizontal aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-xl"
          >
            <SheetHeader>
              <SheetTitle>{labels.filterTitle}</SheetTitle>
              <SheetDescription>{labels.filterDescription}</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-4">{renderFilterControls()}</div>
            <SheetFooter>
              <SheetClose asChild>
                <Button>{labels.done}</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <form
        className="hidden items-end gap-3 border-b p-4 md:grid md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_repeat(4,minmax(9rem,auto))]"
        onSubmit={(event) => {
          event.preventDefault();
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          navigate(values);
        }}
      >
        {renderSearch()}
        {renderFilterControls()}
      </form>
    </>
  );
}

function FilterSelect({
  name,
  label,
  value,
  children,
  onValueChange,
}: {
  name: FilterName;
  label: string;
  value: string;
  children: React.ReactNode;
  onValueChange: (name: FilterName, value: string) => void;
}) {
  return (
    <label className="text-muted-foreground grid gap-1 text-xs">
      {label}
      <Select
        name={name}
        value={value || "all"}
        onValueChange={(nextValue) =>
          onValueChange(
            name,
            nextValue === "all" && name === "lifecycle" ? "" : nextValue,
          )
        }
      >
        <SelectTrigger className="w-full min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </label>
  );
}
