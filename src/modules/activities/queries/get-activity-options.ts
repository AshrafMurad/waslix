import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getActivityOptions(
  access: WorkspaceAccessContext,
  customerId: string,
) {
  return prisma.contact.findMany({
    where: {
      workspaceId: access.workspaceId,
      customerId,
      status: "ACTIVE",
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
}
