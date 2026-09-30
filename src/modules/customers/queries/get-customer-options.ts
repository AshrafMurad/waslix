import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getCustomerOptions(access: WorkspaceAccessContext) {
  const [lifecycleStages, owners, workspace] = await Promise.all([
    prisma.lifecycleStage.findMany({
      where: { workspaceId: access.workspaceId, isActive: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true, name: true, key: true },
    }),
    prisma.workspaceMember.findMany({
      where: {
        workspaceId: access.workspaceId,
        status: "ACTIVE",
        role: { in: ["ADMIN", "CS_MANAGER", "CSM"] },
      },
      orderBy: [{ user: { name: "asc" } }, { id: "asc" }],
      select: { id: true, user: { select: { name: true } } },
    }),
    prisma.workspace.findUniqueOrThrow({
      where: { id: access.workspaceId },
      select: {
        defaultCurrency: true,
        currencies: {
          where: { isActive: true },
          orderBy: [{ isDefault: "desc" }, { code: "asc" }],
          select: { code: true, name: true, symbol: true },
        },
      },
    }),
  ]);
  const currencies = workspace.currencies.length
    ? workspace.currencies
    : [
        {
          code: workspace.defaultCurrency,
          name: workspace.defaultCurrency,
          symbol: workspace.defaultCurrency,
        },
      ];
  return {
    lifecycleStages,
    owners,
    defaultCurrency: workspace.defaultCurrency,
    currencies,
  };
}
