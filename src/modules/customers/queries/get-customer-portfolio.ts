import "server-only";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

const portfolioFilterSchema = z.object({
  query: z.string().trim().max(200).catch(""),
  lifecycle: z.string().uuid().optional().catch(undefined),
  owner: z
    .union([z.literal("all"), z.string().uuid()])
    .optional()
    .catch(undefined),
  status: z.enum(["ACTIVE", "ARCHIVED", "ALL"]).catch("ACTIVE"),
  sort: z.enum(["asc", "desc"]).catch("asc"),
  cursor: z.string().max(1000).optional().catch(undefined),
});

type Cursor = { name: string; id: string };

function decodeCursor(value: string | undefined): Cursor | undefined {
  if (!value) return undefined;
  try {
    const parsed = z
      .object({ name: z.string(), id: z.uuid() })
      .safeParse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function encodeCursor(cursor: Cursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export type CustomerPortfolioFilters = Partial<{
  query: string;
  lifecycle: string;
  owner: string;
  status: string;
  sort: string;
  cursor: string;
}>;

export async function getCustomerPortfolio(
  access: WorkspaceAccessContext,
  input: CustomerPortfolioFilters,
) {
  const filters = portfolioFilterSchema.parse(input);
  const cursor = decodeCursor(filters.cursor);
  const ownerId =
    filters.owner === "all"
      ? undefined
      : (filters.owner ??
        (access.role === "CSM" ? access.memberId : undefined));
  const direction = filters.sort;
  const cursorCondition: Prisma.CustomerWhereInput | undefined = cursor
    ? direction === "asc"
      ? {
          OR: [
            { name: { gt: cursor.name } },
            { name: cursor.name, id: { gt: cursor.id } },
          ],
        }
      : {
          OR: [
            { name: { lt: cursor.name } },
            { name: cursor.name, id: { lt: cursor.id } },
          ],
        }
    : undefined;

  const customers = await prisma.customer.findMany({
    where: {
      workspaceId: access.workspaceId,
      ...(filters.status === "ALL" ? {} : { status: filters.status }),
      ...(ownerId ? { ownerId } : {}),
      ...(filters.lifecycle ? { lifecycleStageId: filters.lifecycle } : {}),
      ...(filters.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: "insensitive" } },
              { website: { contains: filters.query, mode: "insensitive" } },
              {
                contacts: {
                  some: {
                    status: "ACTIVE",
                    OR: [
                      {
                        name: { contains: filters.query, mode: "insensitive" },
                      },
                      {
                        email: { contains: filters.query, mode: "insensitive" },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
      ...(cursorCondition ?? {}),
    },
    orderBy: [{ name: direction }, { id: direction }],
    take: 26,
    select: {
      id: true,
      name: true,
      website: true,
      contractValue: true,
      currency: true,
      renewalDate: true,
      status: true,
      lifecycleStage: { select: { id: true, name: true, key: true } },
      owner: { select: { id: true, user: { select: { name: true } } } },
    },
  });
  const hasNextPage = customers.length > 25;
  const page = customers.slice(0, 25);
  const lastCustomer = page.at(-1);

  return {
    filters: { ...filters, owner: filters.owner ?? ownerId },
    customers: page.map((customer) => ({
      ...customer,
      contractValue: customer.contractValue?.toString() ?? null,
      customerHealth: null,
    })),
    nextCursor:
      hasNextPage && lastCustomer
        ? encodeCursor({ name: lastCustomer.name, id: lastCustomer.id })
        : null,
  };
}
