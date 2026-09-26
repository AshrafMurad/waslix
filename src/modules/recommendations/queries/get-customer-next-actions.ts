import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function getCustomerNextActions(
  access: WorkspaceAccessContext,
  customerId: string,
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: { id: true, ownerId: true, status: true },
  });
  if (!customer) return null;
  const canAct =
    customer.status === "ACTIVE" &&
    access.role !== "VIEWER" &&
    (access.role === "ADMIN" ||
      access.role === "CS_MANAGER" ||
      customer.ownerId === access.memberId);
  const recommendations = await prisma.recommendation.findMany({
    where: {
      workspaceId: access.workspaceId,
      customerId,
      status: { in: ["SUGGESTED", "ACCEPTED"] },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }, { id: "asc" }],
    take: 5,
    select: {
      id: true,
      type: true,
      title: true,
      reason: true,
      priority: true,
      status: true,
      taskId: true,
      playbookRunId: true,
      ruleKey: true,
      createdAt: true,
    },
  });
  return { canAct, recommendations };
}
