import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { createCustomer } from "@/modules/customers/services/manage-customer";
import {
  changeMilestoneStatus,
  moveCompletedOnboardingToAdoption,
  startOnboarding,
  updateMilestone,
} from "@/modules/onboarding/services/manage-onboarding";
import { acceptRecommendation } from "@/modules/recommendations/services/manage-recommendations";
import {
  changeRenewalStage,
  recordRenewedOutcome,
  saveRenewal,
} from "@/modules/renewals/services/manage-renewal";
import { saveRisk } from "@/modules/risks/services/manage-risk";
import { refreshCustomerIntelligence } from "@/modules/signals/services/refresh-customer-intelligence";
import { changeTaskStatus } from "@/modules/tasks/services/manage-task";
import { seedTwoWorkspaceFixture } from "../fixtures/two-workspaces";

describe("M8.5 critical release flows", () => {
  let fixture: Awaited<ReturnType<typeof seedTwoWorkspaceFixture>>;
  const now = new Date("2026-09-24T12:00:00Z");
  const access = () => ({
    userId: fixture.users.manager.id,
    workspaceId: fixture.workspaceA.id,
    memberId: fixture.memberships.alphaManager.id,
    role: "CS_MANAGER" as const,
  });
  const betaAccess = () => ({
    userId: fixture.users.tenantBAdmin.id,
    workspaceId: fixture.workspaceB.id,
    memberId: fixture.memberships.betaAdmin.id,
    role: "ADMIN" as const,
  });

  beforeAll(async () => {
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
    fixture = await seedTwoWorkspaceFixture(prisma);
  });

  afterAll(async () => prisma.$disconnect());

  async function createFixtureCustomer(name: string) {
    return createCustomer(access(), {
      name,
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
    });
  }

  it("accepts attention recommendations into one playbook and completes linked work", async () => {
    const customer = await createFixtureCustomer("Critical Playbook Flow");
    await saveRisk(
      access(),
      {
        riskId: null,
        customerId: customer.id,
        title: "Executive sponsor departed",
        description: null,
        type: "STAKEHOLDER",
        severity: "CRITICAL",
        ownerId: fixture.memberships.alphaManager.id,
        targetResolutionDate: "2026-09-30",
        operationKey: randomUUID(),
      },
      now,
    );
    await refreshCustomerIntelligence(fixture.workspaceA.id, customer.id, now);

    const recommendation = await prisma.recommendation.findFirstOrThrow({
      where: {
        workspaceId: fixture.workspaceA.id,
        customerId: customer.id,
        ruleKey: "RISK_UNRESOLVED",
        status: "SUGGESTED",
      },
    });
    await expect(
      acceptRecommendation(betaAccess(), {
        recommendationId: recommendation.id,
        operationKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "RECOMMENDATION_NOT_FOUND" });

    const operationKey = randomUUID();
    await acceptRecommendation(
      access(),
      { recommendationId: recommendation.id, operationKey },
      now,
    );
    await acceptRecommendation(
      access(),
      { recommendationId: recommendation.id, operationKey },
      now,
    );

    const accepted = await prisma.recommendation.findUniqueOrThrow({
      where: { id: recommendation.id },
      include: { playbookRun: { include: { steps: true, tasks: true } } },
    });
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.playbookRunId).toBeTruthy();
    expect(accepted.playbookRun?.steps.length).toBeGreaterThan(0);
    await expect(
      prisma.playbookRun.count({
        where: { workspaceId: fixture.workspaceA.id, customerId: customer.id },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.attentionItem.findFirstOrThrow({
        where: { workspaceId: fixture.workspaceA.id, customerId: customer.id },
      }),
    ).resolves.toMatchObject({ status: "ACKNOWLEDGED" });

    for (const task of accepted.playbookRun?.tasks ?? []) {
      await changeTaskStatus(
        access(),
        { taskId: task.id, status: "COMPLETED", operationKey: randomUUID() },
        now,
      );
    }

    await expect(
      prisma.playbookRun.findUniqueOrThrow({
        where: { id: accepted.playbookRunId! },
      }),
    ).resolves.toMatchObject({ status: "COMPLETED" });
    await expect(
      prisma.recommendation.findUniqueOrThrow({
        where: { id: recommendation.id },
      }),
    ).resolves.toMatchObject({ status: "COMPLETED" });
  });

  it("detects onboarding delay, completes milestones, and moves lifecycle by user action", async () => {
    const customer = await createFixtureCustomer("Critical Onboarding Flow");
    const onboarding = await startOnboarding(
      access(),
      {
        customerId: customer.id,
        ownerId: fixture.memberships.alphaManager.id,
        startDate: "2026-09-01",
        targetCompletionDate: "2026-09-30",
        operationKey: randomUUID(),
      },
      now,
    );
    const criticalMilestone = await prisma.onboardingMilestone.findFirstOrThrow(
      {
        where: {
          workspaceId: fixture.workspaceA.id,
          onboardingId: onboarding.id,
          isCritical: true,
        },
        orderBy: { position: "asc" },
      },
    );
    await updateMilestone(
      access(),
      {
        customerId: customer.id,
        milestoneId: criticalMilestone.id,
        title: criticalMilestone.title,
        description: null,
        ownerId: fixture.memberships.alphaManager.id,
        dueDate: "2026-09-15",
        isCritical: true,
        operationKey: randomUUID(),
      },
      now,
    );
    await refreshCustomerIntelligence(fixture.workspaceA.id, customer.id, now);
    await expect(
      prisma.signal.findFirstOrThrow({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId: customer.id,
          ruleKey: "ONBOARDING_DELAY",
          status: "ACTIVE",
        },
      }),
    ).resolves.toMatchObject({ severity: "HIGH" });

    const milestones = await prisma.onboardingMilestone.findMany({
      where: {
        workspaceId: fixture.workspaceA.id,
        onboardingId: onboarding.id,
      },
    });
    for (const milestone of milestones) {
      await changeMilestoneStatus(
        access(),
        {
          customerId: customer.id,
          milestoneId: milestone.id,
          status: "COMPLETED",
          operationKey: randomUUID(),
        },
        now,
      );
    }
    await expect(
      prisma.onboarding.findUniqueOrThrow({ where: { id: onboarding.id } }),
    ).resolves.toMatchObject({ status: "COMPLETED" });

    await moveCompletedOnboardingToAdoption(
      access(),
      {
        customerId: customer.id,
        onboardingId: onboarding.id,
        operationKey: randomUUID(),
      },
      now,
    );
    await expect(
      prisma.customer.findUniqueOrThrow({
        where: { id: customer.id },
        include: { lifecycleStage: true },
      }),
    ).resolves.toMatchObject({ lifecycleStage: { key: "adoption" } });
  });

  it("records renewal preparation and a retry-safe renewed outcome", async () => {
    const customer = await createFixtureCustomer("Critical Renewal Flow");
    const renewal = await saveRenewal(
      access(),
      {
        renewalId: undefined,
        customerId: customer.id,
        ownerId: fixture.memberships.alphaManager.id,
        contractValue: 12000,
        currency: "SAR",
        startAt: "2026-01-01",
        renewalAt: "2026-10-03",
        expectedOutcome: "RENEW",
        operationKey: randomUUID(),
      },
      now,
    );
    await refreshCustomerIntelligence(fixture.workspaceA.id, customer.id, now);
    await expect(
      prisma.recommendation.count({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId: customer.id,
          ruleKey: { in: ["RENEWAL_PREPARATION", "RENEWAL_DUE"] },
          status: "SUGGESTED",
        },
      }),
    ).resolves.toBe(2);

    await changeRenewalStage(access(), {
      customerId: customer.id,
      renewalId: renewal.id,
      stage: "PREPARING",
      note: "",
      operationKey: randomUUID(),
    });
    await expect(
      changeRenewalStage(access(), {
        customerId: customer.id,
        renewalId: renewal.id,
        stage: "UPCOMING",
        note: "",
        operationKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "RENEWAL_BACKWARD_NOTE_REQUIRED" });

    const operationKey = randomUUID();
    const outcome = await recordRenewedOutcome(
      access(),
      {
        customerId: customer.id,
        renewalId: renewal.id,
        outcome: "RENEWED",
        nextRenewalAt: "2027-10-03",
        nextContractValue: 15000,
        nextCurrency: "SAR",
        operationKey,
      },
      now,
    );
    await expect(
      recordRenewedOutcome(
        access(),
        {
          customerId: customer.id,
          renewalId: renewal.id,
          outcome: "RENEWED",
          nextRenewalAt: "2027-10-03",
          nextContractValue: 15000,
          nextCurrency: "SAR",
          operationKey,
        },
        now,
      ),
    ).resolves.toEqual(outcome);

    await expect(
      prisma.renewal.count({
        where: { workspaceId: fixture.workspaceA.id, customerId: customer.id },
      }),
    ).resolves.toBe(2);
    await expect(
      prisma.renewal.findUniqueOrThrow({ where: { id: renewal.id } }),
    ).resolves.toMatchObject({ stage: "RENEWED", outcome: "RENEWED" });
    await expect(
      prisma.customer.findUniqueOrThrow({ where: { id: customer.id } }),
    ).resolves.toMatchObject({
      renewalDate: new Date("2027-10-03T00:00:00.000Z"),
    });
  });
});
