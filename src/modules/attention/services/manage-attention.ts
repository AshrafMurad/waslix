import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export class AttentionDomainError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "AttentionDomainError";
  }
}

export async function changeAttentionStatus(
  access: WorkspaceAccessContext,
  itemId: string,
  status: "ACKNOWLEDGED" | "DISMISSED",
  reason: string | null,
  now = new Date(),
) {
  if (access.role === "VIEWER")
    throw new AttentionDomainError("ATTENTION_NOT_FOUND");
  if (status === "DISMISSED" && !reason?.trim())
    throw new AttentionDomainError("ATTENTION_DISMISS_REASON_REQUIRED");
  return prisma.$transaction(async (transaction) => {
    const item = await transaction.attentionItem.findFirst({
      where: {
        id: itemId,
        workspaceId: access.workspaceId,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
      select: {
        id: true,
        priority: true,
        evidenceSignature: true,
        customerId: true,
        customer: { select: { ownerId: true, status: true } },
      },
    });
    const canAct =
      item &&
      item.customer.status === "ACTIVE" &&
      (access.role === "ADMIN" ||
        access.role === "CS_MANAGER" ||
        item.customer.ownerId === access.memberId);
    if (!canAct || !item) throw new AttentionDomainError("ATTENTION_NOT_FOUND");
    return transaction.attentionItem.update({
      where: { id: item.id },
      data:
        status === "ACKNOWLEDGED"
          ? { status, actedById: access.memberId }
          : {
              status,
              actedById: access.memberId,
              dismissedReason: reason!.trim(),
              dismissedSignature: item.evidenceSignature,
              dismissedPriority: item.priority,
              resolvedAt: now,
            },
      select: { id: true },
    });
  });
}
