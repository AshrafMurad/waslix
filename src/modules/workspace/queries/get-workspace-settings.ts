import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getWorkspaceSettings(access: WorkspaceAccessContext) {
  return prisma.workspace.findUniqueOrThrow({
    where: { id: access.workspaceId },
    select: {
      id: true,
      name: true,
      timezone: true,
      defaultCurrency: true,
      currencies: {
        orderBy: [{ isDefault: "desc" }, { code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          symbol: true,
          decimalPlaces: true,
          isActive: true,
          isDefault: true,
        },
      },
      lifecycleStages: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: {
          id: true,
          key: true,
          name: true,
          isActive: true,
          position: true,
        },
      },
    },
  });
}
