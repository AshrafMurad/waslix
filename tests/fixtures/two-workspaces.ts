import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const fixtureUsers = [
  {
    key: "shared",
    name: "Shared Admin",
    email: "admin@example.com",
    legacyEmail: "shared@fixture.waslix.test",
    locale: "EN" as const,
  },
  { key: "manager", name: "CS Manager", locale: "EN" as const },
  { key: "csm", name: "Customer Success Manager", locale: "AR" as const },
  { key: "viewer", name: "Viewer", locale: "EN" as const },
  { key: "inactive", name: "Inactive Member", locale: "AR" as const },
  { key: "tenantBAdmin", name: "Tenant B Admin", locale: "AR" as const },
] as const;

export async function seedTwoWorkspaceFixture(
  prisma: PrismaClient,
  credentialPassword?: string,
) {
  const users = Object.fromEntries(
    await Promise.all(
      fixtureUsers.map(async (fixtureUser) => {
        const email =
          "email" in fixtureUser
            ? fixtureUser.email
            : `${fixtureUser.key}@fixture.waslix.test`;
        const existingUser = await prisma.user.findFirst({
          where: {
            email: {
              in: [
                email,
                ...("legacyEmail" in fixtureUser
                  ? [fixtureUser.legacyEmail]
                  : []),
              ],
            },
          },
          select: { id: true },
        });
        const user = existingUser
          ? await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                email,
                name: fixtureUser.name,
                preferredLocale: fixtureUser.locale,
              },
            })
          : await prisma.user.create({
              data: {
                name: fixtureUser.name,
                email,
                emailVerified: true,
                preferredLocale: fixtureUser.locale,
              },
            });

        return [fixtureUser.key, user] as const;
      }),
    ),
  );

  if (credentialPassword) {
    await Promise.all(
      Object.values(users).map(async (user) => {
        const password = await hashPassword(credentialPassword);
        await prisma.account.upsert({
          where: {
            providerId_accountId: {
              providerId: "credential",
              accountId: user.id,
            },
          },
          update: { password, userId: user.id },
          create: {
            providerId: "credential",
            accountId: user.id,
            userId: user.id,
            password,
          },
        });
      }),
    );
  }

  const workspaceA = await prisma.workspace.upsert({
    where: { slug: "fixture-alpha" },
    update: { name: "Fixture Alpha" },
    create: {
      name: "Fixture Alpha",
      slug: "fixture-alpha",
      timezone: "Asia/Riyadh",
      defaultCurrency: "SAR",
    },
  });
  const workspaceB = await prisma.workspace.upsert({
    where: { slug: "fixture-beta" },
    update: { name: "Fixture Beta" },
    create: {
      name: "Fixture Beta",
      slug: "fixture-beta",
      timezone: "UTC",
      defaultCurrency: "USD",
    },
  });

  async function upsertMembership(
    workspaceId: string,
    userId: string,
    role: "ADMIN" | "CS_MANAGER" | "CSM" | "VIEWER",
    status: "ACTIVE" | "INACTIVE" = "ACTIVE",
  ) {
    return prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId } },
      update: { role, status },
      create: { workspaceId, userId, role, status },
    });
  }

  const memberships = {
    alphaAdmin: await upsertMembership(workspaceA.id, users.shared.id, "ADMIN"),
    alphaManager: await upsertMembership(
      workspaceA.id,
      users.manager.id,
      "CS_MANAGER",
    ),
    alphaCsm: await upsertMembership(workspaceA.id, users.csm.id, "CSM"),
    alphaViewer: await upsertMembership(
      workspaceA.id,
      users.viewer.id,
      "VIEWER",
    ),
    alphaInactive: await upsertMembership(
      workspaceA.id,
      users.inactive.id,
      "CSM",
      "INACTIVE",
    ),
    betaSharedViewer: await upsertMembership(
      workspaceB.id,
      users.shared.id,
      "VIEWER",
    ),
    betaAdmin: await upsertMembership(
      workspaceB.id,
      users.tenantBAdmin.id,
      "ADMIN",
    ),
  };

  const stageDefinitions = [
    ["new", "New"],
    ["onboarding", "Onboarding"],
    ["adoption", "Adoption"],
    ["active", "Active"],
    ["renewal", "Renewal"],
    ["churned", "Churned"],
  ] as const;
  async function seedStages(workspaceId: string) {
    return Promise.all(
      stageDefinitions.map(([key, name], position) =>
        prisma.lifecycleStage.upsert({
          where: { workspaceId_key: { workspaceId, key } },
          update: { name, position, isActive: true },
          create: { workspaceId, key, name, position },
        }),
      ),
    );
  }
  const [alphaStages, betaStages] = await Promise.all([
    seedStages(workspaceA.id),
    seedStages(workspaceB.id),
  ]);

  return {
    users,
    workspaceA,
    workspaceB,
    memberships,
    alphaStages,
    betaStages,
  };
}
