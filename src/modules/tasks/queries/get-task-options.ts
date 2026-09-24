import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getTaskOptions(access: WorkspaceAccessContext) {
  const [owners, customers] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: {
        workspaceId: access.workspaceId,
        status: "ACTIVE",
        role: { in: ["ADMIN", "CS_MANAGER", "CSM"] },
      },
      orderBy: [{ user: { name: "asc" } }, { id: "asc" }],
      select: { id: true, user: { select: { name: true } } },
    }),
    prisma.customer.findMany({
      where: { workspaceId: access.workspaceId, status: "ACTIVE" },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, ownerId: true },
    }),
  ]);
  return { owners, customers };
}
