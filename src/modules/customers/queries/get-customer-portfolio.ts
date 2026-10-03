import "server-only";

import type { Prisma } from "@prisma/client";
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
  page: z.coerce.number().int().positive().max(10000).catch(1),
});

const PAGE_SIZE = 10;

export type CustomerPortfolioFilters = Partial<{
  query: string;
  lifecycle: string;
  owner: string;
  status: string;
  sort: string;
  page: string;
}>;

export async function getCustomerPortfolio(
  access: WorkspaceAccessContext,
  input: CustomerPortfolioFilters,
) {
  const filters = portfolioFilterSchema.parse(input);
  const ownerId =
    filters.owner === "all"
      ? undefined
      : (filters.owner ??
        (access.role === "CSM" ? access.memberId : undefined));
  const direction = filters.sort;
  const where: Prisma.CustomerWhereInput = {
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
  };
  const totalCount = await prisma.customer.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);

  const customers = await prisma.customer.findMany({
    where,
    orderBy: [{ name: direction }, { id: direction }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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
      currentHealth: {
        select: { overallScore: true, status: true, calculatedAt: true },
      },
    },
  });
  return {
    filters: { ...filters, owner: filters.owner ?? ownerId, page: currentPage },
    customers: customers.map((customer) => ({
      ...customer,
      contractValue: customer.contractValue?.toString() ?? null,
      customerHealth: customer.currentHealth,
    })),
    pagination: {
      currentPage,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages,
    },
  };
}
