import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getCustomerOverview(
  access: WorkspaceAccessContext,
  customerId: string,
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: {
      id: true,
      name: true,
      website: true,
      industry: true,
      companySize: true,
      contractValue: true,
      currency: true,
      customerSince: true,
      renewalDate: true,
      status: true,
      archivedAt: true,
      lifecycleStage: { select: { id: true, name: true, key: true } },
      owner: { select: { id: true, user: { select: { name: true } } } },
      tags: { select: { tag: { select: { id: true, name: true } } } },
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { name: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          jobTitle: true,
          accountRole: true,
          isPrimary: true,
          status: true,
        },
      },
    },
  });
  if (!customer) return null;
  return {
    ...customer,
    contractValue: customer.contractValue?.toString() ?? null,
    tags: customer.tags.map(({ tag }) => tag),
    health: null,
  };
}
