import "server-only";

import { randomUUID } from "node:crypto";

import type { WorkspacePlan } from "@prisma/client";

import { auth } from "@/lib/auth/auth";
import { AuthenticationRequiredError } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

const defaultStages = [
  ["new", "New"],
  ["onboarding", "Onboarding"],
  ["adoption", "Adoption"],
  ["active", "Active"],
  ["renewal", "Renewal"],
  ["churned", "Churned"],
] as const;

export function slugifyWorkspaceName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function uniqueWorkspaceSlug(baseName: string) {
  const base = slugifyWorkspaceName(baseName) || "workspace";
  for (let index = 0; index < 50; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
  }

  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function getWorkspaceOnboardingState(requestHeaders: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) throw new AuthenticationRequiredError();

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          onboardingCompleted: true,
          subscription: { select: { id: true, plan: true, status: true } },
        },
      },
    },
  });

  return { userId: session.user.id, memberships };
}

export async function createWorkspaceForCurrentUser(
  requestHeaders: Headers,
  input: { name: string; plan: WorkspacePlan },
) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) throw new AuthenticationRequiredError();

  const slug = await uniqueWorkspaceSlug(input.name);
  const workspace = await prisma.$transaction(async (transaction) => {
    const createdWorkspace = await transaction.workspace.create({
      data: {
        name: input.name,
        slug,
        ownerId: session.user.id,
        onboardingCompleted: true,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
            status: "ACTIVE",
          },
        },
        subscription: {
          create: {
            plan: input.plan,
            status: input.plan === "FREE" ? "ACTIVE" : "TRIALING",
            trialEndsAt:
              input.plan === "FREE"
                ? null
                : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        },
        currencies: {
          create: {
            code: "USD",
            name: "US Dollar",
            symbol: "$",
            decimalPlaces: 2,
            isActive: true,
            isDefault: true,
          },
        },
        lifecycleStages: {
          create: defaultStages.map(([key, name], position) => ({
            key,
            name,
            position,
          })),
        },
      },
      select: { id: true },
    });

    return createdWorkspace;
  });

  await auth.api.setActiveOrganization({
    headers: requestHeaders,
    body: { organizationId: workspace.id },
  });

  return workspace;
}
