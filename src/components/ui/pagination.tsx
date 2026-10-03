import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { cn } from "cn";

import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn(
        "flex flex-row flex-wrap items-center gap-1.5 sm:gap-2",
        className,
      )}
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

function PaginationLink({
  className,
  isActive,
  ...props
}: React.ComponentProps<typeof Link> & {
  isActive?: boolean;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      className={cn(
        buttonVariants({
          variant: isActive ? "default" : "ghost",
          size: isActive ? "sm" : "icon-sm",
        }),
        isActive
          ? "bg-brand text-brand-foreground hover:bg-brand/90 min-w-fit px-3 shadow-[0_12px_28px_-18px_rgb(15_118_110_/_0.85)]"
          : "text-muted-foreground hover:bg-brand/10 hover:text-brand",
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof Link> & {
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        className={cn("gap-1 px-2.5", className)}
      >
        <ChevronLeftIcon className="rtl:rotate-180" />
        <span>{children}</span>
      </Button>
    );
  }

  return (
    <Link
      data-slot="pagination-previous"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "text-muted-foreground hover:bg-brand/10 hover:text-brand gap-1 px-2.5",
        className,
      )}
      {...props}
    >
      <ChevronLeftIcon className="rtl:rotate-180" />
      <span>{children}</span>
    </Link>
  );
}

function PaginationNext({
  className,
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof Link> & {
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled
        className={cn("gap-1 px-2.5", className)}
      >
        <span>{children}</span>
        <ChevronRightIcon className="rtl:rotate-180" />
      </Button>
    );
  }

  return (
    <Link
      data-slot="pagination-next"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "border-brand/30 text-brand hover:bg-brand/10 hover:text-brand gap-1 px-2.5",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <ChevronRightIcon className="rtl:rotate-180" />
    </Link>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "text-muted-foreground flex size-8 items-center justify-center",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
