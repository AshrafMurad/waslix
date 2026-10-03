import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, "end-ellipsis", totalPages];
  if (currentPage >= totalPages - 2)
    return [1, "start-ellipsis", totalPages - 2, totalPages - 1, totalPages];

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
}

type DashboardPaginationProps = {
  currentPage: number;
  totalPages: number;
  getPageHref: (page: number) => string;
  labels: {
    summary: string;
    previous: string;
    next: string;
    page: (page: number) => string;
  };
  className?: string;
};

export function DashboardPagination({
  currentPage,
  totalPages,
  getPageHref,
  labels,
  className,
}: DashboardPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <Pagination className={className}>
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-muted-foreground text-center text-sm tabular-nums sm:text-start">
          {labels.summary}
        </p>
        <PaginationContent className="max-w-full flex-nowrap justify-start overflow-x-auto px-1 pb-1 sm:justify-end sm:overflow-visible sm:px-0 sm:pb-0">
          <PaginationItem>
            <PaginationPrevious
              href={hasPrevious ? getPageHref(currentPage - 1) : "#"}
              disabled={!hasPrevious}
              className="max-[420px]:size-9 max-[420px]:px-0 max-[420px]:[&_span]:sr-only"
            >
              {labels.previous}
            </PaginationPrevious>
          </PaginationItem>
          {pages.map((page) => (
            <PaginationItem key={page}>
              {typeof page === "number" ? (
                <PaginationLink
                  href={getPageHref(page)}
                  isActive={page === currentPage}
                  aria-label={labels.page(page)}
                >
                  {page}
                </PaginationLink>
              ) : (
                <PaginationEllipsis />
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href={hasNext ? getPageHref(currentPage + 1) : "#"}
              disabled={!hasNext}
              className="max-[420px]:size-9 max-[420px]:px-0 max-[420px]:[&_span]:sr-only"
            >
              {labels.next}
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </div>
    </Pagination>
  );
}
