"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";

export type CustomerTableRow = {
  id: string;
  name: string;
  website: string | null;
  contractValue: string | null;
  currency: string;
  renewalDate: Date | null;
  status: "ACTIVE" | "ARCHIVED";
  lifecycleStage: { name: string };
  owner: { user: { name: string } };
  customerHealth: null;
};

type CustomerTableProps = {
  rows: CustomerTableRow[];
  locale: string;
  labels: Record<
    | "customer"
    | "health"
    | "lifecycle"
    | "owner"
    | "value"
    | "renewal"
    | "unknown"
    | "archived"
    | "missing",
    string
  >;
};

const columnHelper = createColumnHelper<CustomerTableRow>();

export function CustomerTable({ rows, locale, labels }: CustomerTableProps) {
  const date = new Intl.DateTimeFormat(locale, {
    calendar: "gregory",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const columns = [
    columnHelper.accessor("name", {
      header: labels.customer,
      cell: ({ row }) => (
        <div className="flex min-w-48 items-center gap-3 text-start">
          <Avatar>
            <AvatarFallback className="bg-brand text-brand-foreground">
              {row.original.name.trim().charAt(0).toLocaleUpperCase(locale)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link
              href={`/customers/${row.original.id}`}
              className="block truncate font-medium hover:underline"
              dir="auto"
            >
              {row.original.name}
            </Link>
            <span
              className="text-muted-foreground block truncate text-xs"
              dir="auto"
            >
              {row.original.website ?? labels.missing}
            </span>
          </div>
        </div>
      ),
    }),
    columnHelper.display({
      id: "health",
      header: labels.health,
      cell: () => (
        <span className="text-muted-foreground">{labels.unknown}</span>
      ),
    }),
    columnHelper.accessor("lifecycleStage.name", {
      header: labels.lifecycle,
      cell: (info) => <span dir="auto">{info.getValue()}</span>,
    }),
    columnHelper.accessor("owner.user.name", {
      header: labels.owner,
      cell: (info) => <span dir="auto">{info.getValue()}</span>,
    }),
    columnHelper.accessor("contractValue", {
      header: labels.value,
      cell: ({ row, getValue }) =>
        getValue()
          ? new Intl.NumberFormat(locale, {
              style: "currency",
              currency: row.original.currency,
              currencyDisplay: "code",
            }).format(Number(getValue()))
          : labels.missing,
    }),
    columnHelper.accessor("renewalDate", {
      header: labels.renewal,
      cell: (info) =>
        info.getValue() ? date.format(info.getValue()!) : labels.missing,
    }),
  ];
  // TanStack Table intentionally returns callable table state that React Compiler does not memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table
      className="min-w-4xl border-collapse"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className="bg-raised hover:bg-raised text-start"
          >
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} className="px-4 text-start">
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="px-4 text-start">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
