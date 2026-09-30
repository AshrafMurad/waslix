"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { globalSearchAction } from "@/modules/search/actions/search-actions";

type SearchResult = Awaited<ReturnType<typeof globalSearchAction>>[number];

type GlobalSearchProps = {
  className?: string;
  labels: {
    trigger: string;
    title: string;
    placeholder: string;
    empty: string;
    error: string;
    loading: string;
    customer: string;
    contact: string;
    task: string;
  };
};

export function GlobalSearch({ className, labels }: GlobalSearchProps) {
  const locale = useLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const timeout = window.setTimeout(() => {
      const currentRequest = requestId.current + 1;
      requestId.current = currentRequest;
      startTransition(async () => {
        try {
          const nextResults = await globalSearchAction(query);
          if (requestId.current !== currentRequest) return;
          setResults(nextResults);
          setError(undefined);
        } catch {
          if (requestId.current !== currentRequest) return;
          setResults([]);
          setError(labels.error);
        }
      });
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [labels.error, query]);

  const typeLabel = {
    customer: labels.customer,
    contact: labels.contact,
    task: labels.task,
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn("min-w-64 gap-2.5", className)}
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden min-w-0 flex-1 text-start md:inline">
          {labels.trigger}
        </span>
        <kbd className="text-muted-foreground ms-2 hidden text-xs lg:inline">
          Ctrl K
        </kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={direction}>
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
          </DialogHeader>
          <Input
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (nextQuery.trim().length < 2) {
                requestId.current += 1;
                setResults([]);
                setError(undefined);
              }
            }}
            placeholder={labels.placeholder}
            dir="auto"
            autoFocus
          />
          <div
            className="max-h-80 space-y-1 overflow-y-auto"
            aria-busy={isPending}
          >
            {error ? (
              <p className="text-risk p-3 text-sm" role="alert">
                {error}
              </p>
            ) : null}
            {!error && isPending ? (
              <p className="text-muted-foreground p-3 text-sm">
                {labels.loading}
              </p>
            ) : null}
            {!error &&
            !isPending &&
            query.trim().length >= 2 &&
            !results.length ? (
              <p className="text-muted-foreground p-3 text-sm">
                {labels.empty}
              </p>
            ) : null}
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.href}
                onClick={() => setOpen(false)}
                className="waslix-result-row hover:bg-raised block rounded-md p-3"
              >
                <span className="text-muted-foreground text-xs uppercase">
                  {typeLabel[result.type]}
                </span>
                <span className="block font-medium" dir="auto">
                  {result.title}
                </span>
                {result.subtitle ? (
                  <span
                    className="text-muted-foreground block text-sm"
                    dir="auto"
                  >
                    {result.subtitle}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
