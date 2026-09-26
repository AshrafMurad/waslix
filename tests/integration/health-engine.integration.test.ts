import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { createCustomer } from "@/modules/customers/services/manage-customer";
import { saveGoal } from "@/modules/goals/services/manage-goal";
import { updateHealthInput } from "@/modules/health/services/manage-health-input";
import { recalculateCustomerHealth } from "@/modules/health/services/recalculate-customer-health";
import { seedTwoWorkspaceFixture } from "../fixtures/two-workspaces";

describe("health engine persistence", () => {
  let fixture: Awaited<ReturnType<typeof seedTwoWorkspaceFixture>>;
  let customerId: string;
  const now = new Date("2026-09-24T12:00:00.000Z");
  const managerAccess = () => ({
    userId: fixture.users.manager.id,
    workspaceId: fixture.workspaceA.id,
    memberId: fixture.memberships.alphaManager.id,
    role: "CS_MANAGER" as const,
  });

  beforeAll(async () => {
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
    fixture = await seedTwoWorkspaceFixture(prisma);
    customerId = (
      await createCustomer(managerAccess(), {
        name: "M4 Customer",
        website: null,
        industry: null,
        companySize: null,
        contractValue: null,
        currency: "SAR",
        customerSince: "2026-01-01",
        renewalDate: null,
        lifecycleStageId: fixture.alphaStages[2].id,
        ownerId: fixture.memberships.alphaManager.id,
        tags: [],
      })
    ).id;
  });

  afterAll(async () => prisma.$disconnect());

  it("persists authorized goals and derives the goals dimension", async () => {
    const operationKey = randomUUID();
    const goal = await saveGoal(
      managerAccess(),
      {
        customerId,
        title: "Reach production adoption",
        description: null,
        ownerId: fixture.memberships.alphaManager.id,
        progress: 70,
        status: "IN_PROGRESS",
        targetDate: "2026-11-01",
        operationKey,
      },
      now,
    );
    await expect(
      saveGoal(
        managerAccess(),
        {
          customerId,
          title: "Reach production adoption",
          description: null,
          ownerId: fixture.memberships.alphaManager.id,
          progress: 70,
          status: "IN_PROGRESS",
          targetDate: "2026-11-01",
          operationKey,
        },
        now,
      ),
    ).resolves.toEqual(goal);

    const result = await recalculateCustomerHealth({
      workspaceId: fixture.workspaceA.id,
      customerId,
      now,
    });
    expect(result).toMatchObject({
      overallScore: 70,
      status: "NEEDS_ATTENTION",
    });
    await expect(
      prisma.successGoal.count({
        where: { workspaceId: fixture.workspaceA.id },
      }),
    ).resolves.toBe(1);
  });

  it("normalizes selected inputs and preserves immutable revisions", async () => {
    await updateHealthInput(
      managerAccess(),
      {
        customerId,
        dimension: "USAGE",
        value: 60,
        observedAt: now,
        isSimulated: true,
        operationKey: randomUUID(),
      },
      now,
    );
    await updateHealthInput(
      managerAccess(),
      {
        customerId,
        dimension: "SUPPORT",
        value: 50,
        observedAt: now,
        isSimulated: false,
        operationKey: randomUUID(),
      },
      now,
    );
    const result = await recalculateCustomerHealth({
      workspaceId: fixture.workspaceA.id,
      customerId,
      now,
    });
    expect(result?.overallScore).toBe(60);
    await expect(
      prisma.healthInputRevision.count({
        where: { workspaceId: fixture.workspaceA.id, customerId },
      }),
    ).resolves.toBe(2);
  });

  it("deduplicates snapshot replay and stale jobs reload current facts", async () => {
    const first = await recalculateCustomerHealth({
      workspaceId: fixture.workspaceA.id,
      customerId,
      now,
    });
    await recalculateCustomerHealth({
      workspaceId: fixture.workspaceA.id,
      customerId,
      now,
    });
    await expect(
      prisma.healthSnapshot.count({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId,
          calculationKey: first?.calculationKey,
        },
      }),
    ).resolves.toBe(1);

    await updateHealthInput(
      managerAccess(),
      {
        customerId,
        dimension: "USAGE",
        value: 100,
        observedAt: now,
        isSimulated: true,
        operationKey: randomUUID(),
      },
      now,
    );
    const latest = await recalculateCustomerHealth({
      workspaceId: fixture.workspaceA.id,
      customerId,
      now: new Date("2026-09-24T12:05:00.000Z"),
    });
    expect(latest?.overallScore).toBe(79);
    await expect(
      prisma.customerHealth.findUniqueOrThrow({
        where: {
          workspaceId_customerId: {
            workspaceId: fixture.workspaceA.id,
            customerId,
          },
        },
      }),
    ).resolves.toMatchObject({ overallScore: 79, pendingSince: null });
  });

  it("rejects cross-workspace health writes without disclosing the customer", async () => {
    await expect(
      updateHealthInput(
        {
          userId: fixture.users.tenantBAdmin.id,
          workspaceId: fixture.workspaceB.id,
          memberId: fixture.memberships.betaAdmin.id,
          role: "ADMIN",
        },
        {
          customerId,
          dimension: "USAGE",
          value: 90,
          observedAt: now,
          isSimulated: false,
          operationKey: randomUUID(),
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "HEALTH_NOT_FOUND" });

    await expect(
      saveGoal(
        {
          userId: fixture.users.csm.id,
          workspaceId: fixture.workspaceA.id,
          memberId: fixture.memberships.alphaCsm.id,
          role: "CSM",
        },
        {
          customerId,
          title: "Unauthorized goal",
          description: null,
          ownerId: fixture.memberships.alphaCsm.id,
          progress: 10,
          status: "IN_PROGRESS",
          targetDate: null,
          operationKey: randomUUID(),
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" });
  });
});
