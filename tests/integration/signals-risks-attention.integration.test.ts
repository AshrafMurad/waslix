import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import {
  archiveCustomer,
  createCustomer,
  updateCustomer,
} from "@/modules/customers/services/manage-customer";
import {
  changeRiskStatus,
  createRiskMitigation,
  saveRisk,
} from "@/modules/risks/services/manage-risk";
import { refreshCustomerIntelligence } from "@/modules/signals/services/refresh-customer-intelligence";
import { seedTwoWorkspaceFixture } from "../fixtures/two-workspaces";

describe("M5 signals, risks, and attention", () => {
  let fixture: Awaited<ReturnType<typeof seedTwoWorkspaceFixture>>;
  let customerId: string;
  let riskId: string;
  const now = new Date("2026-09-24T12:00:00Z");
  const access = () => ({
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
      await createCustomer(access(), {
        name: "M5 Customer",
        website: null,
        industry: null,
        companySize: null,
        contractValue: null,
        currency: "SAR",
        customerSince: "2026-01-01",
        renewalDate: "2026-10-01",
        lifecycleStageId: fixture.alphaStages[2].id,
        ownerId: fixture.memberships.alphaManager.id,
        tags: [],
      })
    ).id;
  });

  afterAll(async () => prisma.$disconnect());

  it("persists risk lifecycle, deterministic signals, and one grouped attention item", async () => {
    riskId = (
      await saveRisk(
        access(),
        {
          riskId: null,
          customerId,
          title: "Executive sponsor departed",
          description: "Replacement unknown",
          type: "STAKEHOLDER",
          severity: "CRITICAL",
          ownerId: fixture.memberships.alphaManager.id,
          targetResolutionDate: "2026-09-30",
          operationKey: randomUUID(),
        },
        now,
      )
    ).id;
    await Promise.all([
      refreshCustomerIntelligence(fixture.workspaceA.id, customerId, now),
      refreshCustomerIntelligence(fixture.workspaceA.id, customerId, now),
    ]);
    await expect(
      prisma.signal.count({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId,
          status: "ACTIVE",
        },
      }),
    ).resolves.toBe(3);
    await expect(
      prisma.attentionItem.count({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId,
          status: { in: ["OPEN", "ACKNOWLEDGED"] },
        },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.attentionItem.findFirstOrThrow({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId,
          status: "OPEN",
        },
      }),
    ).resolves.toMatchObject({ priority: "CRITICAL" });
  });

  it("requires a resolution note and mitigation does not resolve the risk", async () => {
    await expect(
      changeRiskStatus(
        access(),
        {
          riskId,
          status: "RESOLVED",
          resolutionNote: null,
          operationKey: randomUUID(),
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "RISK_RESOLUTION_NOTE_REQUIRED" });
    const task = await createRiskMitigation(
      access(),
      riskId,
      randomUUID(),
      now,
    );
    await refreshCustomerIntelligence(fixture.workspaceA.id, customerId, now);
    await expect(
      prisma.signal.count({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId,
          ruleKey: "UNMANAGED_RISK",
          status: "ACTIVE",
        },
      }),
    ).resolves.toBe(0);
    await expect(
      prisma.risk.findUniqueOrThrow({ where: { id: riskId } }),
    ).resolves.toMatchObject({ status: "OPEN" });
    await expect(
      prisma.task.findUniqueOrThrow({ where: { id: task.id } }),
    ).resolves.toMatchObject({ riskId });
  });

  it("retains resolved history and transfers only open risk work", async () => {
    await changeRiskStatus(
      access(),
      {
        riskId,
        status: "RESOLVED",
        resolutionNote: "New sponsor confirmed",
        operationKey: randomUUID(),
      },
      now,
    );
    await refreshCustomerIntelligence(fixture.workspaceA.id, customerId, now);
    const openRisk = await saveRisk(
      access(),
      {
        riskId: null,
        customerId,
        title: "Adoption plan",
        description: null,
        type: "USAGE",
        severity: "MEDIUM",
        ownerId: fixture.memberships.alphaManager.id,
        targetResolutionDate: null,
        operationKey: randomUUID(),
      },
      now,
    );
    await updateCustomer(access(), customerId, {
      name: "M5 Customer",
      website: null,
      industry: null,
      companySize: null,
      contractValue: null,
      currency: "SAR",
      customerSince: "2026-01-01",
      renewalDate: "2026-10-01",
      lifecycleStageId: fixture.alphaStages[2].id,
      ownerId: fixture.memberships.alphaCsm.id,
      tags: [],
    });
    await expect(
      prisma.risk.findUniqueOrThrow({ where: { id: openRisk.id } }),
    ).resolves.toMatchObject({ ownerId: fixture.memberships.alphaCsm.id });
    await expect(
      prisma.risk.findUniqueOrThrow({ where: { id: riskId } }),
    ).resolves.toMatchObject({
      ownerId: fixture.memberships.alphaManager.id,
      status: "RESOLVED",
      resolutionNote: "New sponsor confirmed",
    });
  });

  it("rejects cross-workspace risk access and expires attention on archive", async () => {
    await expect(
      saveRisk(
        {
          userId: fixture.users.tenantBAdmin.id,
          workspaceId: fixture.workspaceB.id,
          memberId: fixture.memberships.betaAdmin.id,
          role: "ADMIN",
        },
        {
          riskId: null,
          customerId,
          title: "Cross tenant",
          description: null,
          type: "OTHER",
          severity: "HIGH",
          ownerId: fixture.memberships.betaAdmin.id,
          targetResolutionDate: null,
          operationKey: randomUUID(),
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "RISK_NOT_FOUND" });
    await archiveCustomer(access(), customerId);
    await expect(
      prisma.signal.count({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId,
          status: "ACTIVE",
        },
      }),
    ).resolves.toBe(0);
    await expect(
      prisma.attentionItem.count({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId,
          status: { in: ["OPEN", "ACKNOWLEDGED"] },
        },
      }),
    ).resolves.toBe(0);
  });
});
