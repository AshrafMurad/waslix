import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

import { calculateOnboardingProgress } from "../engine/calculate-onboarding";

function dateOnly(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

function localDate(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function getCustomerOnboarding(
  access: WorkspaceAccessContext,
  customerId: string,
  now = new Date(),
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: {
      id: true,
      ownerId: true,
      status: true,
      lifecycleStage: { select: { key: true } },
      workspace: { select: { timezone: true } },
      onboarding: {
        select: {
          id: true,
          ownerId: true,
          status: true,
          startDate: true,
          targetCompletionDate: true,
          completedAt: true,
          adoptionDismissedForCompletedAt: true,
          owner: { select: { user: { select: { name: true } } } },
          milestones: {
            orderBy: [{ position: "asc" }, { id: "asc" }],
            select: {
              id: true,
              title: true,
              description: true,
              ownerId: true,
              position: true,
              isCritical: true,
              status: true,
              dueDate: true,
              completedAt: true,
              owner: { select: { user: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });
  if (!customer) return null;
  const localToday = localDate(now, customer.workspace.timezone);
  const progress = customer.onboarding
    ? calculateOnboardingProgress({
        localToday,
        targetCompletionDate: dateOnly(
          customer.onboarding.targetCompletionDate,
        ),
        milestones: customer.onboarding.milestones.map((milestone) => ({
          ...milestone,
          dueDate: dateOnly(milestone.dueDate),
        })),
      })
    : null;
  return {
    customer,
    localToday,
    progress,
    shouldSuggestAdoption:
      customer.onboarding?.status === "COMPLETED" &&
      customer.lifecycleStage.key !== "adoption" &&
      customer.onboarding.completedAt != null &&
      customer.onboarding.adoptionDismissedForCompletedAt?.getTime() !==
        customer.onboarding.completedAt.getTime(),
  };
}
