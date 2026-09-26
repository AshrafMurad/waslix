import { PrismaClient } from "@prisma/client";

import { seedTwoWorkspaceFixture } from "../tests/fixtures/two-workspaces";

async function main() {
  const prisma = new PrismaClient();
  const configuredFixturePassword = process.env.SEED_FIXTURE_PASSWORD?.trim();
  const fixturePassword =
    process.env.NODE_ENV === "production"
      ? configuredFixturePassword
      : (configuredFixturePassword ?? "admin123");

  if (!fixturePassword) {
    throw new Error("SEED_FIXTURE_PASSWORD is required in production");
  }

  try {
    const fixture = await seedTwoWorkspaceFixture(prisma, fixturePassword);
    const customers = [
      [
        "northstar",
        "Northstar Labs",
        "Cloud infrastructure",
        "125000.00",
        "active",
        fixture.memberships.alphaCsm.id,
      ],
      [
        "noura",
        "Noura Commerce",
        "E-commerce",
        "86000.00",
        "adoption",
        fixture.memberships.alphaCsm.id,
      ],
      [
        "atlas",
        "Atlas Logistics",
        "Logistics",
        "210000.00",
        "renewal",
        fixture.memberships.alphaManager.id,
      ],
      [
        "bayt",
        "Bayt Analytics",
        "Analytics",
        "72000.00",
        "onboarding",
        fixture.memberships.alphaManager.id,
      ],
      [
        "cedar",
        "Cedar Health",
        "Healthcare",
        "154000.00",
        "active",
        fixture.memberships.alphaAdmin.id,
      ],
      [
        "sahab",
        "Sahab Systems",
        "Cybersecurity",
        "98000.00",
        "new",
        fixture.memberships.alphaAdmin.id,
      ],
    ] as const;
    const seededCustomers = new Map<string, { id: string; ownerId: string }>();
    for (const [
      externalKey,
      name,
      industry,
      contractValue,
      stageKey,
      ownerId,
    ] of customers) {
      const stage = fixture.alphaStages.find((item) => item.key === stageKey)!;
      const customer = await prisma.customer.upsert({
        where: {
          workspaceId_externalKey: {
            workspaceId: fixture.workspaceA.id,
            externalKey,
          },
        },
        update: {
          name,
          industry,
          contractValue,
          lifecycleStageId: stage.id,
          ownerId,
          status: "ACTIVE",
          archivedAt: null,
        },
        create: {
          workspaceId: fixture.workspaceA.id,
          externalKey,
          name,
          industry,
          contractValue,
          currency: "SAR",
          lifecycleStageId: stage.id,
          ownerId,
          renewalDate: new Date("2027-03-31T00:00:00.000Z"),
        },
      });
      seededCustomers.set(externalKey, { id: customer.id, ownerId });
      await prisma.contact.deleteMany({
        where: { workspaceId: fixture.workspaceA.id, customerId: customer.id },
      });
      await prisma.contact.create({
        data: {
          workspaceId: fixture.workspaceA.id,
          customerId: customer.id,
          name: `${name} Lead`,
          email: `${externalKey}@example.test`,
          accountRole: "CHAMPION",
          isPrimary: true,
        },
      });
    }

    const northstar = seededCustomers.get("northstar")!;
    const atlas = seededCustomers.get("atlas")!;
    const cedar = seededCustomers.get("cedar")!;
    const noura = seededCustomers.get("noura")!;
    const bayt = seededCustomers.get("bayt")!;
    const sahab = seededCustomers.get("sahab")!;
    const seededCustomerIds = [...seededCustomers.values()].map(
      (customer) => customer.id,
    );
    await prisma.$transaction(async (transaction) => {
      await transaction.attentionSignal.deleteMany({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId: { in: seededCustomerIds },
        },
      });
      await transaction.riskSignal.deleteMany({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId: { in: seededCustomerIds },
        },
      });
      await transaction.attentionItem.deleteMany({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId: { in: seededCustomerIds },
        },
      });
      await transaction.signal.deleteMany({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId: { in: seededCustomerIds },
        },
      });
      await transaction.task.deleteMany({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId: { in: seededCustomerIds },
          riskId: { not: null },
        },
      });
      await transaction.risk.deleteMany({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId: { in: seededCustomerIds },
        },
      });
      await transaction.renewal.deleteMany({
        where: {
          workspaceId: fixture.workspaceA.id,
          customerId: { in: seededCustomerIds },
        },
      });

      await transaction.renewal.createMany({
        data: [
          {
            workspaceId: fixture.workspaceA.id,
            customerId: atlas.id,
            ownerId: atlas.ownerId,
            contractValue: "210000.00",
            currency: "SAR",
            startAt: new Date("2026-01-01T00:00:00.000Z"),
            renewalAt: new Date("2026-10-03T00:00:00.000Z"),
            stage: "UPCOMING",
            readinessStatus: "AT_RISK",
            readinessReasons: ["HIGH_RISK_OPEN", "ENGAGEMENT_STALE"],
            readinessCalculatedAt: new Date("2026-09-26T09:00:00.000Z"),
            expectedOutcome: "RENEW",
          },
          {
            workspaceId: fixture.workspaceA.id,
            customerId: northstar.id,
            ownerId: northstar.ownerId,
            contractValue: "125000.00",
            currency: "SAR",
            startAt: new Date("2026-04-01T00:00:00.000Z"),
            renewalAt: new Date("2026-10-24T00:00:00.000Z"),
            stage: "PREPARING",
            readinessStatus: "NEEDS_ATTENTION",
            readinessReasons: ["RISK_OPEN", "GOALS_LOW"],
            readinessCalculatedAt: new Date("2026-09-26T09:00:00.000Z"),
            expectedOutcome: "EXPAND",
          },
          {
            workspaceId: fixture.workspaceA.id,
            customerId: cedar.id,
            ownerId: cedar.ownerId,
            contractValue: "154000.00",
            currency: "SAR",
            startAt: new Date("2026-03-01T00:00:00.000Z"),
            renewalAt: new Date("2026-11-20T00:00:00.000Z"),
            stage: "DISCUSSION",
            readinessStatus: "HEALTHY",
            readinessReasons: [],
            readinessCalculatedAt: new Date("2026-09-26T09:00:00.000Z"),
            expectedOutcome: "RENEW",
          },
          {
            workspaceId: fixture.workspaceA.id,
            customerId: noura.id,
            ownerId: noura.ownerId,
            contractValue: "86000.00",
            currency: "SAR",
            startAt: new Date("2026-08-01T00:00:00.000Z"),
            renewalAt: new Date("2026-12-26T00:00:00.000Z"),
            stage: "UPCOMING",
            readinessStatus: null,
            readinessReasons: [],
            readinessCalculatedAt: null,
            expectedOutcome: "UNKNOWN",
          },
          {
            workspaceId: fixture.workspaceA.id,
            customerId: bayt.id,
            ownerId: bayt.ownerId,
            contractValue: "72000.00",
            currency: "SAR",
            startAt: new Date("2026-02-01T00:00:00.000Z"),
            renewalAt: new Date("2026-09-10T00:00:00.000Z"),
            stage: "RENEWED",
            readinessStatus: "NEEDS_ATTENTION",
            readinessReasons: ["ONBOARDING_DELAYED"],
            readinessCalculatedAt: new Date("2026-08-15T09:00:00.000Z"),
            expectedOutcome: "RENEW",
            outcome: "RENEWED",
            completedAt: new Date("2026-09-08T12:00:00.000Z"),
          },
          {
            workspaceId: fixture.workspaceA.id,
            customerId: sahab.id,
            ownerId: sahab.ownerId,
            contractValue: "98000.00",
            currency: "SAR",
            startAt: new Date("2025-09-01T00:00:00.000Z"),
            renewalAt: new Date("2026-08-28T00:00:00.000Z"),
            stage: "CHURNED",
            readinessStatus: "AT_RISK",
            readinessReasons: ["HEALTH_AT_RISK", "ENGAGEMENT_STALE"],
            readinessCalculatedAt: new Date("2026-08-01T09:00:00.000Z"),
            expectedOutcome: "CHURN",
            outcome: "CHURNED",
            completedAt: new Date("2026-08-25T12:00:00.000Z"),
            churnReason: "Customer consolidated tools during budget reduction.",
          },
        ],
      });
      await Promise.all([
        transaction.customer.update({
          where: { id: atlas.id },
          data: { renewalDate: new Date("2026-10-03T00:00:00.000Z") },
        }),
        transaction.customer.update({
          where: { id: northstar.id },
          data: { renewalDate: new Date("2026-10-24T00:00:00.000Z") },
        }),
        transaction.customer.update({
          where: { id: cedar.id },
          data: { renewalDate: new Date("2026-11-20T00:00:00.000Z") },
        }),
        transaction.customer.update({
          where: { id: noura.id },
          data: { renewalDate: new Date("2026-12-26T00:00:00.000Z") },
        }),
      ]);

      const northstarRisk = await transaction.risk.create({
        data: {
          id: "51000000-0000-4000-8000-000000000001",
          workspaceId: fixture.workspaceA.id,
          customerId: northstar.id,
          title: "Executive sponsor transition",
          description:
            "The previous sponsor left and a replacement has not been confirmed.",
          type: "STAKEHOLDER",
          severity: "HIGH",
          ownerId: northstar.ownerId,
          targetResolutionDate: new Date("2026-10-15T00:00:00.000Z"),
        },
      });
      const atlasRisk = await transaction.risk.create({
        data: {
          id: "51000000-0000-4000-8000-000000000002",
          workspaceId: fixture.workspaceA.id,
          customerId: atlas.id,
          title: "Renewal decision blocked",
          description: "Commercial approval is waiting on an executive review.",
          type: "RENEWAL",
          severity: "CRITICAL",
          ownerId: atlas.ownerId,
          status: "MONITORING",
          targetResolutionDate: new Date("2026-10-03T00:00:00.000Z"),
        },
      });
      await transaction.risk.create({
        data: {
          id: "51000000-0000-4000-8000-000000000003",
          workspaceId: fixture.workspaceA.id,
          customerId: cedar.id,
          title: "Support escalation",
          description: "A priority incident required weekly executive updates.",
          type: "SUPPORT",
          severity: "HIGH",
          ownerId: cedar.ownerId,
          status: "RESOLVED",
          resolvedAt: new Date("2026-09-18T12:00:00.000Z"),
          resolutionNote:
            "The incident was closed and the customer confirmed stability.",
        },
      });
      await transaction.task.create({
        data: {
          id: "52000000-0000-4000-8000-000000000001",
          workspaceId: fixture.workspaceA.id,
          customerId: atlas.id,
          riskId: atlasRisk.id,
          title: atlasRisk.title,
          ownerId: atlas.ownerId,
          createdById: fixture.memberships.alphaManager.id,
          priority: "HIGH",
          dueDate: new Date("2026-10-01T00:00:00.000Z"),
        },
      });

      const northstarUnresolved = await transaction.signal.create({
        data: {
          id: "53000000-0000-4000-8000-000000000001",
          workspaceId: fixture.workspaceA.id,
          customerId: northstar.id,
          type: "RISK_UNRESOLVED",
          ruleKey: "RISK_UNRESOLVED",
          ruleVersion: "signals-v1",
          subjectKey: `risk:${northstarRisk.id}`,
          episodeKey: "54000000-0000-4000-8000-000000000001",
          severity: "HIGH",
          title: "RISK_UNRESOLVED",
          sourceType: "RISK",
          sourceRef: northstarRisk.id,
          evidence: { version: 1, severity: "HIGH" },
          detectedAt: new Date("2026-09-20T09:00:00.000Z"),
          lastEvaluatedAt: new Date("2026-09-24T09:00:00.000Z"),
        },
      });
      const northstarUnmanaged = await transaction.signal.create({
        data: {
          id: "53000000-0000-4000-8000-000000000002",
          workspaceId: fixture.workspaceA.id,
          customerId: northstar.id,
          type: "UNMANAGED_RISK",
          ruleKey: "UNMANAGED_RISK",
          ruleVersion: "signals-v1",
          subjectKey: `risk:${northstarRisk.id}`,
          episodeKey: "54000000-0000-4000-8000-000000000002",
          severity: "HIGH",
          title: "UNMANAGED_RISK",
          sourceType: "RISK",
          sourceRef: northstarRisk.id,
          evidence: { version: 1, severity: "HIGH", hasMitigation: false },
          detectedAt: new Date("2026-09-20T09:00:00.000Z"),
          lastEvaluatedAt: new Date("2026-09-24T09:00:00.000Z"),
        },
      });
      const atlasUnresolved = await transaction.signal.create({
        data: {
          id: "53000000-0000-4000-8000-000000000003",
          workspaceId: fixture.workspaceA.id,
          customerId: atlas.id,
          type: "RISK_UNRESOLVED",
          ruleKey: "RISK_UNRESOLVED",
          ruleVersion: "signals-v1",
          subjectKey: `risk:${atlasRisk.id}`,
          episodeKey: "54000000-0000-4000-8000-000000000003",
          severity: "CRITICAL",
          title: "RISK_UNRESOLVED",
          sourceType: "RISK",
          sourceRef: atlasRisk.id,
          evidence: { version: 1, severity: "CRITICAL" },
          detectedAt: new Date("2026-09-19T09:00:00.000Z"),
          lastEvaluatedAt: new Date("2026-09-24T09:00:00.000Z"),
        },
      });
      await transaction.riskSignal.createMany({
        data: [
          {
            workspaceId: fixture.workspaceA.id,
            customerId: northstar.id,
            riskId: northstarRisk.id,
            signalId: northstarUnresolved.id,
          },
          {
            workspaceId: fixture.workspaceA.id,
            customerId: northstar.id,
            riskId: northstarRisk.id,
            signalId: northstarUnmanaged.id,
          },
          {
            workspaceId: fixture.workspaceA.id,
            customerId: atlas.id,
            riskId: atlasRisk.id,
            signalId: atlasUnresolved.id,
          },
        ],
      });
      const northstarAttention = await transaction.attentionItem.create({
        data: {
          id: "55000000-0000-4000-8000-000000000001",
          workspaceId: fixture.workspaceA.id,
          customerId: northstar.id,
          priority: "HIGH",
          reasonSummary: "RISK_UNRESOLVED,UNMANAGED_RISK",
          evidenceSignature:
            "04d11f8fcb3ff6786342760d95138f8b9c68b918d970ca8f62528bbf55c52b5f",
          nearestDeadline: new Date("2026-10-15T00:00:00.000Z"),
        },
      });
      const atlasAttention = await transaction.attentionItem.create({
        data: {
          id: "55000000-0000-4000-8000-000000000002",
          workspaceId: fixture.workspaceA.id,
          customerId: atlas.id,
          priority: "CRITICAL",
          reasonSummary: "RISK_UNRESOLVED",
          evidenceSignature:
            "1bc9247e5c7122c2168f2f706169693844e754011dc7c70c33f88f9480f53079",
          nearestDeadline: new Date("2026-10-03T00:00:00.000Z"),
        },
      });
      await transaction.attentionSignal.createMany({
        data: [
          {
            workspaceId: fixture.workspaceA.id,
            customerId: northstar.id,
            attentionItemId: northstarAttention.id,
            signalId: northstarUnresolved.id,
          },
          {
            workspaceId: fixture.workspaceA.id,
            customerId: northstar.id,
            attentionItemId: northstarAttention.id,
            signalId: northstarUnmanaged.id,
          },
          {
            workspaceId: fixture.workspaceA.id,
            customerId: atlas.id,
            attentionItemId: atlasAttention.id,
            signalId: atlasUnresolved.id,
          },
        ],
      });
    });
    await seedTwoWorkspaceFixture(
      prisma,
      process.env.NODE_ENV === "production" ? fixturePassword : "admin123",
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
