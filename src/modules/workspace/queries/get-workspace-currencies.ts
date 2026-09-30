import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getActiveWorkspaceCurrencies(
  access: WorkspaceAccessContext,
) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: access.workspaceId },
    select: {
      defaultCurrency: true,
      currencies: {
        where: { isActive: true },
        orderBy: [{ isDefault: "desc" }, { code: "asc" }],
        select: { code: true, name: true, symbol: true },
      },
    },
  });
  return workspace.currencies.length
    ? workspace.currencies
    : [
        {
          code: workspace.defaultCurrency,
          name: workspace.defaultCurrency,
          symbol: workspace.defaultCurrency,
        },
      ];
}
