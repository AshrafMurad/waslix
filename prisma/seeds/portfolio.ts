import type { Prisma, PrismaClient } from "@prisma/client";

import { calculateHealth } from "../../src/modules/health/engine/calculate-health";
import { calculateRenewalReadiness } from "../../src/modules/renewals/engine/calculate-renewal-readiness";
import { refreshCustomerIntelligence } from "../../src/modules/signals/services/refresh-customer-intelligence";
import { ensureBuiltInPlaybookTemplates } from "../../src/modules/playbooks/services/manage-playbook";
import { addDays, dateOnly, stableUuid } from "./helpers";
import { buildCustomerProfiles } from "./profiles";

const firstNames = [
  "Amina",
  "Noah",
  "Layla",
  "Ethan",
  "Maya",
  "Omar",
  "Sofia",
  "Daniel",
  "Nora",
  "Adam",
  "Lina",
  "Yousef",
] as const;
const lastNames = [
  "Rahman",
  "Bennett",
  "Malik",
  "Morgan",
  "Chen",
  "Hassan",
  "Reed",
  "Brooks",
  "Kareem",
  "Foster",
  "Saleh",
  "Parker",
] as const;
const contactRoles = [
  ["CHAMPION", "Head of Product"],
  ["DECISION_MAKER", "Chief Operating Officer"],
  ["EXECUTIVE_SPONSOR", "Chief Executive Officer"],
  ["ADMIN", "Technical Lead"],
  ["BILLING", "Finance Director"],
  ["USER", "Operations Manager"],
  ["OTHER", "Procurement Manager"],
] as const;
const activityTitles = [
  "Quarterly Business Review",
  "Adoption Check-in",
  "Renewal Planning Call",
  "Onboarding Follow-up",
  "Technical Integration Review",
  "Executive Alignment Meeting",
  "Product Feedback Session",
  "Expansion Discussion",
  "Billing Issue Follow-up",
  "Support Escalation Review",
] as const;
const taskTitles = [
  "Schedule QBR",
  "Review adoption metrics",
  "Follow up on integration blocker",
  "Prepare renewal proposal",
  "Contact executive sponsor",
  "Resolve billing concern",
  "Review health score decline",
  "Send onboarding resources",
  "Discuss expansion opportunity",
  "Investigate usage drop",
  "Confirm implementation milestone",
  "Review open support escalation",
] as const;
const goalTitles = [
  "Launch the first production workflow",
  "Increase weekly active team adoption",
  "Complete the core systems integration",
  "Establish executive outcome reporting",
] as const;
const milestoneTitles = [
  "Kickoff",
  "Configuration",
  "Data setup",
  "Training",
  "First value",
  "Complete",
] as const;
const tagNames = [
  "Strategic",
  "Growth",
  "High Touch",
  "Digital Success",
  "Expansion Ready",
  "Executive Sponsor",
  "Integration",
  "Regional",
] as const;

type Members = {
  adminId: string;
  managerId: string;
  csmId: string;
};

export async function seedDemoPortfolio(
  prisma: PrismaClient,
  input: {
    workspaceId: string;
    stageIds: Map<string, string>;
    members: Members;
    now: Date;
    randomSeed: string;
  },
) {
  const profiles = buildCustomerProfiles(input.now, input.randomSeed);
  const owners = [
    ...Array(49).fill(input.members.csmId),
    ...Array(41).fill(input.members.managerId),
    ...Array(30).fill(input.members.adminId),
  ] as string[];
  const customerIds = profiles.map((profile) =>
    stableUuid(`customer:${profile.externalKey}`),
  );

  await clearCustomerData(prisma, input.workspaceId);

  await prisma.$transaction(
    async (transaction) => {
      await ensureBuiltInPlaybookTemplates(transaction, input.workspaceId);
      await transaction.tag.createMany({
        data: tagNames.map((name, index) => ({
          id: stableUuid(`tag:${index}`),
          workspaceId: input.workspaceId,
          name,
          normalizedName: name.toLowerCase(),
        })),
        skipDuplicates: true,
      });

      await transaction.customer.createMany({
        data: profiles.map((profile, index) => ({
          id: customerIds[index],
          workspaceId: input.workspaceId,
          externalKey: profile.externalKey,
          name: profile.name,
          website: profile.website,
          industry: profile.industry,
          companySize: profile.companySize,
          contractValue: profile.contractValue,
          currency: profile.currency,
          customerSince: profile.customerSince,
          lifecycleStageId: input.stageIds.get(profile.lifecycleKey)!,
          ownerId: owners[index],
        })),
      });

      await seedContacts(transaction, input, profiles, customerIds);
      await seedTags(transaction, input.workspaceId, profiles, customerIds);
      await seedActivities(transaction, input, profiles, customerIds, owners);
      await seedGoals(transaction, input, profiles, customerIds, owners);
      await seedHealth(transaction, input, profiles, customerIds);
      await seedRisks(transaction, input, profiles, customerIds, owners);
      await seedOnboarding(transaction, input, profiles, customerIds, owners);
      await seedRenewals(transaction, input, profiles, customerIds, owners);
      await seedTasks(transaction, input, profiles, customerIds, owners);
      await seedPlaybookRuns(transaction, input, profiles, customerIds, owners);
      await seedSystemEvents(transaction, input, profiles, customerIds, owners);
    },
    { timeout: 120_000 },
  );

  for (const customerId of customerIds) {
    await refreshCustomerIntelligence(input.workspaceId, customerId, input.now);
  }

  return reconcileAndSummarize(
    prisma,
    input.workspaceId,
    profiles.length,
    input.now,
  );
}

async function clearCustomerData(prisma: PrismaClient, workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { slug: true },
  });
  if (workspace?.slug !== "fixture-alpha")
    throw new Error(
      "Demo portfolio can only replace fixture-alpha customer data",
    );
  await prisma.$transaction(
    async (transaction) => {
      await transaction.importRow.deleteMany({
        where: { workspaceId, customerId: { not: null } },
      });
      await transaction.recommendation.deleteMany({ where: { workspaceId } });
      await transaction.playbookStep.deleteMany({ where: { workspaceId } });
      await transaction.task.deleteMany({ where: { workspaceId } });
      await transaction.playbookRun.deleteMany({ where: { workspaceId } });
      await transaction.attentionSignal.deleteMany({ where: { workspaceId } });
      await transaction.riskSignal.deleteMany({ where: { workspaceId } });
      await transaction.attentionItem.deleteMany({ where: { workspaceId } });
      await transaction.signal.deleteMany({ where: { workspaceId } });
      await transaction.risk.deleteMany({ where: { workspaceId } });
      await transaction.renewal.deleteMany({ where: { workspaceId } });
      await transaction.onboardingMilestone.deleteMany({
        where: { workspaceId },
      });
      await transaction.onboarding.deleteMany({ where: { workspaceId } });
      await transaction.successGoal.deleteMany({ where: { workspaceId } });
      await transaction.healthSnapshot.deleteMany({ where: { workspaceId } });
      await transaction.customerHealth.deleteMany({ where: { workspaceId } });
      await transaction.healthInputRevision.deleteMany({
        where: { workspaceId },
      });
      await transaction.healthInput.deleteMany({ where: { workspaceId } });
      await transaction.activity.deleteMany({ where: { workspaceId } });
      await transaction.contact.deleteMany({ where: { workspaceId } });
      await transaction.customerTag.deleteMany({ where: { workspaceId } });
      await transaction.systemEvent.deleteMany({
        where: { workspaceId, customerId: { not: null } },
      });
      await transaction.jobOutbox.deleteMany({
        where: { workspaceId, customerId: { not: null } },
      });
      await transaction.customer.deleteMany({ where: { workspaceId } });
    },
    { timeout: 120_000 },
  );
}

async function seedContacts(
  transaction: Prisma.TransactionClient,
  input: { workspaceId: string; now: Date },
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
) {
  const rows = profiles.flatMap((profile, customerIndex) =>
    Array.from({ length: profile.contactCount }, (_, contactIndex) => {
      const role = contactRoles[contactIndex % contactRoles.length];
      const firstName =
        firstNames[(customerIndex + contactIndex * 3) % firstNames.length];
      const lastName =
        lastNames[(customerIndex * 2 + contactIndex) % lastNames.length];
      return {
        id: stableUuid(`contact:${profile.externalKey}:${contactIndex}`),
        workspaceId: input.workspaceId,
        customerId: customerIds[customerIndex],
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${profile.slug}.example.com`,
        phone:
          customerIndex === 14 || (customerIndex + contactIndex) % 5 === 0
            ? null
            : `+1-555-${String(1000 + customerIndex * 10 + contactIndex).slice(-4)}`,
        jobTitle: role[1],
        accountRole: role[0],
        isPrimary: contactIndex === 0,
        status:
          contactIndex === profile.contactCount - 1 &&
          profile.contactCount > 4 &&
          customerIndex % 4 === 0
            ? ("INACTIVE" as const)
            : ("ACTIVE" as const),
        lastInteractionAt: profile.activityCount
          ? addDays(input.now, -Math.min(55, Math.max(1, 102 - profile.score)))
          : null,
      };
    }),
  );
  await transaction.contact.createMany({ data: rows });
}

async function seedTags(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
) {
  await transaction.customerTag.createMany({
    data: profiles.flatMap((profile, index) => {
      if (profile.index === 14) return [];
      const tagIndexes = new Set([
        index % tagNames.length,
        (index + 3) % tagNames.length,
      ]);
      if (profile.segment === "STRATEGIC") tagIndexes.add(0);
      return [...tagIndexes].map((tagIndex) => ({
        workspaceId,
        customerId: customerIds[index],
        tagId: stableUuid(`tag:${tagIndex}`),
      }));
    }),
  });
}

async function seedActivities(
  transaction: Prisma.TransactionClient,
  input: { workspaceId: string; now: Date },
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
  owners: string[],
) {
  await transaction.activity.createMany({
    data: profiles.flatMap((profile, customerIndex) =>
      Array.from({ length: profile.activityCount }, (_, activityIndex) => {
        const type = (["MEETING", "CALL", "EMAIL", "NOTE"] as const)[
          activityIndex % 4
        ];
        const dormantAge =
          profile.index === 5 ? 70 : Math.max(1, 102 - profile.score);
        return {
          id: stableUuid(`activity:${profile.externalKey}:${activityIndex}`),
          workspaceId: input.workspaceId,
          customerId: customerIds[customerIndex],
          contactId: stableUuid(`contact:${profile.externalKey}:0`),
          type,
          title:
            activityTitles[
              (customerIndex + activityIndex) % activityTitles.length
            ],
          description: activityDescription(profile.score, activityIndex),
          createdById: owners[customerIndex],
          occurredAt: addDays(
            input.now,
            -(dormantAge + activityIndex * (3 + (customerIndex % 4))),
          ),
          isMeaningful: type !== "NOTE",
        };
      }),
    ),
  });
}

function activityDescription(score: number, index: number) {
  if (score < 40)
    return "The customer raised adoption and support concerns; an executive follow-up is required.";
  if (score < 60)
    return "Usage has declined and the team agreed to review blockers before the next checkpoint.";
  if (index % 4 === 0)
    return "The champion confirmed progress and shared the next outcome milestone.";
  return "The team reviewed current outcomes, open actions, and the next success milestone.";
}

async function seedGoals(
  transaction: Prisma.TransactionClient,
  input: { workspaceId: string; now: Date },
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
  owners: string[],
) {
  await transaction.successGoal.createMany({
    data: profiles.flatMap((profile, customerIndex) => {
      if (profile.index === 14) return [];
      const count = 1 + (customerIndex % 3);
      return Array.from({ length: count }, (_, goalIndex) => {
        const progress = Math.max(
          5,
          Math.min(100, profile.score + goalIndex * 8 - 10),
        );
        const status =
          progress === 100
            ? "ACHIEVED"
            : progress < 45
              ? "AT_RISK"
              : "IN_PROGRESS";
        const observedAt = addDays(
          input.now,
          profile.score < 60 && goalIndex === 0 ? -36 : -(goalIndex + 2),
        );
        return {
          id: stableUuid(`goal:${profile.externalKey}:${goalIndex}`),
          workspaceId: input.workspaceId,
          customerId: customerIds[customerIndex],
          title: goalTitles[(customerIndex + goalIndex) % goalTitles.length],
          description:
            "A measurable customer outcome agreed with the account team.",
          ownerId: owners[customerIndex],
          progress,
          status: status as "ACHIEVED" | "AT_RISK" | "IN_PROGRESS",
          targetDate: dateOnly(addDays(input.now, 30 + goalIndex * 25)),
          progressObservedAt: observedAt,
          completedAt: status === "ACHIEVED" ? observedAt : null,
        };
      });
    }),
  });
}

async function seedHealth(
  transaction: Prisma.TransactionClient,
  input: { workspaceId: string; now: Date },
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
) {
  for (const [index, profile] of profiles.entries()) {
    const customerId = customerIds[index];
    const dimensions = Object.values(profile.health.dimensions);
    await transaction.healthInput.createMany({
      data: dimensions.map((dimension) => ({
        id: stableUuid(
          `health-input:${profile.externalKey}:${dimension.dimension}`,
        ),
        workspaceId: input.workspaceId,
        customerId,
        dimension: dimension.dimension,
      })),
    });
    await transaction.healthInputRevision.createMany({
      data: dimensions.map((dimension) => ({
        id: stableUuid(
          `health-revision:${profile.externalKey}:${dimension.dimension}`,
        ),
        workspaceId: input.workspaceId,
        customerId,
        healthInputId: stableUuid(
          `health-input:${profile.externalKey}:${dimension.dimension}`,
        ),
        version: 1,
        value: dimension.score,
        sourceType: dimension.source,
        sourceRef: dimension.sourceId,
        isSimulated: true,
        observedAt: dimension.observedAt,
        evidence: { version: 1, source: "DETERMINISTIC_DEMO" },
      })),
    });
    const evidence = healthEvidence(
      profile.health,
      profile,
      customerId,
      input.now,
    );
    await transaction.customerHealth.create({
      data: {
        id: stableUuid(`customer-health:${profile.externalKey}`),
        workspaceId: input.workspaceId,
        customerId,
        rawScore: profile.health.rawScore,
        overallScore: profile.health.overallScore,
        status: profile.health.status,
        usageScore: profile.health.dimensions.USAGE?.score,
        engagementScore: profile.health.dimensions.ENGAGEMENT?.score,
        supportScore: profile.health.dimensions.SUPPORT?.score,
        goalScore: profile.health.dimensions.GOALS?.score,
        confidence: profile.health.confidence,
        confidenceValue: profile.health.confidenceValue,
        calculatedAt: input.now,
        calculationKey: `seed-current:${profile.externalKey}`,
        ruleVersion: "health-v1",
        evidence,
      },
    });
    const snapshots = Array.from({ length: 14 }, (_, snapshotIndex) => {
      const daysAgo = (13 - snapshotIndex) * 7;
      const historicalScore = Math.max(
        0,
        Math.min(
          100,
          profile.score - Math.round((profile.scoreTrend * daysAgo) / 30),
        ),
      );
      const history = calculateHealth(
        (["USAGE", "ENGAGEMENT", "SUPPORT", "GOALS"] as const).map(
          (dimension) => ({
            dimension,
            score: historicalScore,
            observedAt: addDays(input.now, -daysAgo),
            source:
              dimension === "ENGAGEMENT" || dimension === "GOALS"
                ? ("SYSTEM" as const)
                : ("MANUAL" as const),
            sourceId: `history:${profile.externalKey}:${dimension}`,
            isSimulated: true,
          }),
        ),
        addDays(input.now, -daysAgo),
      );
      return {
        id: stableUuid(
          `health-snapshot:${profile.externalKey}:${snapshotIndex}`,
        ),
        workspaceId: input.workspaceId,
        customerId,
        rawScore: history.rawScore,
        overallScore: history.overallScore,
        status: history.status,
        usageScore: historicalScore,
        engagementScore: historicalScore,
        supportScore: historicalScore,
        goalScore: historicalScore,
        confidence: history.confidence,
        confidenceValue: history.confidenceValue,
        snapshotAt: addDays(input.now, -daysAgo),
        calculationKey: `seed-weekly:${profile.externalKey}:${snapshotIndex}`,
        ruleVersion: "health-v1",
        evidence: healthEvidence(
          history,
          profile,
          customerId,
          addDays(input.now, -daysAgo),
        ),
      };
    });
    await transaction.healthSnapshot.createMany({ data: snapshots });
  }
}

function healthEvidence(
  health: ReturnType<typeof calculateHealth>,
  profile: ReturnType<typeof buildCustomerProfiles>[number],
  customerId: string,
  now: Date,
): Prisma.InputJsonValue {
  return {
    version: 1,
    dimensions: Object.fromEntries(
      Object.entries(health.dimensions).map(([key, value]) => [
        key,
        { ...value, observedAt: value.observedAt.toISOString() },
      ]),
    ),
    nativeFacts: {
      meaningfulActivity: profile.activityCount
        ? {
            id: stableUuid(`activity:${profile.externalKey}:0`),
            occurredAt: addDays(
              now,
              -Math.max(1, 102 - profile.score),
            ).toISOString(),
          }
        : null,
      goals:
        profile.index === 14
          ? []
          : [
              {
                id: stableUuid(`goal:${profile.externalKey}:0`),
                progress: Math.max(5, Math.min(100, profile.score - 10)),
                status: profile.score < 55 ? "AT_RISK" : "IN_PROGRESS",
                observedAt: addDays(now, -2).toISOString(),
              },
            ],
    },
  } as Prisma.InputJsonValue;
}

async function seedRisks(
  transaction: Prisma.TransactionClient,
  input: { workspaceId: string; now: Date },
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
  owners: string[],
) {
  const riskTypes = [
    "USAGE",
    "ENGAGEMENT",
    "SUPPORT",
    "STAKEHOLDER",
    "ONBOARDING",
    "RENEWAL",
    "COMMERCIAL",
    "OTHER",
  ] as const;
  await transaction.risk.createMany({
    data: profiles.flatMap((profile, index) => {
      if (!profile.hasRisk) return [];
      const resolved = index % 4 === 0;
      const severity =
        profile.score < 40
          ? "CRITICAL"
          : profile.score < 60
            ? "HIGH"
            : index % 3 === 0
              ? "MEDIUM"
              : "LOW";
      return [
        {
          id: stableUuid(`risk:${profile.externalKey}:0`),
          workspaceId: input.workspaceId,
          customerId: customerIds[index],
          title: riskTitle(riskTypes[index % riskTypes.length]),
          description:
            "The account team is tracking this issue with an explicit owner and next checkpoint.",
          type: riskTypes[index % riskTypes.length],
          severity: severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          ownerId: owners[index],
          status: resolved
            ? ("RESOLVED" as const)
            : index % 3 === 0
              ? ("MONITORING" as const)
              : ("OPEN" as const),
          targetResolutionDate: dateOnly(
            addDays(input.now, resolved ? -7 : 5 + (index % 30)),
          ),
          resolvedAt: resolved ? addDays(input.now, -5) : null,
          resolutionNote: resolved
            ? "The customer confirmed the corrective action resolved the concern."
            : null,
          createdAt: addDays(input.now, -40 - (index % 80)),
        },
      ];
    }),
  });
}

function riskTitle(type: string) {
  return (
    {
      USAGE: "Adoption below target",
      ENGAGEMENT: "Champion engagement declining",
      SUPPORT: "Support escalation under review",
      STAKEHOLDER: "Executive sponsor transition",
      ONBOARDING: "Implementation milestone delayed",
      RENEWAL: "Renewal decision at risk",
      COMMERCIAL: "Budget approval outstanding",
      OTHER: "Customer outcome dependency",
    } as Record<string, string>
  )[type];
}

async function seedOnboarding(
  transaction: Prisma.TransactionClient,
  input: { workspaceId: string; now: Date },
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
  owners: string[],
) {
  const onboardingProfiles = profiles.filter(
    (profile) =>
      profile.lifecycleKey === "onboarding" ||
      (profile.lifecycleKey === "adoption" && profile.index % 2 === 0),
  );
  for (const profile of onboardingProfiles) {
    const index = profile.index;
    const isCompleted = profile.lifecycleKey === "adoption";
    const completedCount = isCompleted ? 6 : index === 3 ? 0 : index % 6;
    const onboardingId = stableUuid(`onboarding:${profile.externalKey}`);
    await transaction.onboarding.create({
      data: {
        id: onboardingId,
        workspaceId: input.workspaceId,
        customerId: customerIds[index],
        ownerId: owners[index],
        status: isCompleted
          ? "COMPLETED"
          : completedCount
            ? "IN_PROGRESS"
            : "NOT_STARTED",
        startDate: dateOnly(addDays(input.now, -35 - (index % 30))),
        targetCompletionDate: dateOnly(
          addDays(
            input.now,
            index === 4 ? -12 : index % 5 === 0 ? -8 : 20 + (index % 25),
          ),
        ),
        completedAt: isCompleted
          ? addDays(input.now, -10 - (index % 20))
          : null,
      },
    });
    await transaction.onboardingMilestone.createMany({
      data: milestoneTitles.map((title, milestoneIndex) => {
        const completed = milestoneIndex < completedCount;
        return {
          id: stableUuid(`milestone:${profile.externalKey}:${milestoneIndex}`),
          workspaceId: input.workspaceId,
          customerId: customerIds[index],
          onboardingId,
          title,
          description: `Complete the ${title.toLowerCase()} phase with the customer team.`,
          ownerId: owners[index],
          position: milestoneIndex + 1,
          isCritical: milestoneIndex === 2 || milestoneIndex === 4,
          status: completed
            ? ("COMPLETED" as const)
            : milestoneIndex === completedCount
              ? ("IN_PROGRESS" as const)
              : ("NOT_STARTED" as const),
          dueDate: dateOnly(
            addDays(input.now, -28 + milestoneIndex * 12 + (index % 4)),
          ),
          completedAt: completed
            ? addDays(input.now, -30 + milestoneIndex * 10)
            : null,
        };
      }),
    });
  }
}

async function seedRenewals(
  transaction: Prisma.TransactionClient,
  input: { workspaceId: string; now: Date },
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
  owners: string[],
) {
  const offsets = [
    -9, 0, 1, 4, 7, 12, 14, 20, 30, 45, 60, 75, 90, 120, 180, 270, 365,
  ];
  const stages = [
    "UPCOMING",
    "PREPARING",
    "DISCUSSION",
    "NEGOTIATION",
    "COMMITTED",
  ] as const;
  for (const profile of profiles) {
    const index = profile.index;
    if (profile.lifecycleKey === "churned") {
      await transaction.renewal.create({
        data: {
          id: stableUuid(`renewal:${profile.externalKey}:churned`),
          workspaceId: input.workspaceId,
          customerId: customerIds[index],
          ownerId: owners[index],
          contractValue: profile.contractValue,
          currency: profile.currency,
          startAt: dateOnly(addDays(input.now, -380)),
          renewalAt: dateOnly(addDays(input.now, -20 - index)),
          stage: "CHURNED",
          readinessStatus: "AT_RISK",
          readinessReasons: ["HEALTH_AT_RISK"],
          readinessCalculatedAt: addDays(input.now, -30),
          expectedOutcome: "CHURN",
          outcome: "CHURNED",
          completedAt: addDays(input.now, -22),
          churnReason:
            "The customer consolidated vendors after a budget review.",
        },
      });
      continue;
    }
    if (index % 5 === 0 || index === 9) {
      await transaction.renewal.create({
        data: {
          id: stableUuid(`renewal:${profile.externalKey}:history`),
          workspaceId: input.workspaceId,
          customerId: customerIds[index],
          ownerId: owners[index],
          contractValue: Math.round(profile.contractValue * 0.9),
          currency: profile.currency,
          startAt: dateOnly(addDays(input.now, -730)),
          renewalAt: dateOnly(addDays(input.now, -365 + (index % 120))),
          stage: "RENEWED",
          readinessStatus: profile.score < 60 ? "AT_RISK" : "HEALTHY",
          readinessReasons: [],
          readinessCalculatedAt: addDays(input.now, -400),
          expectedOutcome: index % 10 === 0 ? "EXPAND" : "RENEW",
          outcome: index % 10 === 0 ? "EXPANDED" : "RENEWED",
          completedAt: addDays(input.now, -368 + (index % 120)),
          notes: "Renewal completed following a documented value review.",
        },
      });
    }
    if (
      profile.lifecycleKey === "new" ||
      profile.lifecycleKey === "onboarding" ||
      (index % 3 === 2 && index !== 8)
    )
      continue;
    const offset = offsets[index % offsets.length];
    const renewalAt = dateOnly(addDays(input.now, offset));
    const meaningfulDate = profile.activityCount
      ? addDays(input.now, -Math.max(1, 102 - profile.score))
          .toISOString()
          .slice(0, 10)
      : null;
    const readiness = calculateRenewalReadiness({
      localToday: input.now.toISOString().slice(0, 10),
      renewalAt: renewalAt.toISOString().slice(0, 10),
      healthScore: profile.score,
      supportScore: profile.health.dimensions.SUPPORT?.score ?? null,
      lastMeaningfulInteractionAt: meaningfulDate,
      unresolvedRisks:
        profile.hasRisk && index % 4 !== 0
          ? [
              {
                severity:
                  profile.score < 40
                    ? "CRITICAL"
                    : profile.score < 60
                      ? "HIGH"
                      : "MEDIUM",
              },
            ]
          : [],
      goals:
        profile.index === 14
          ? []
          : [
              {
                progress: Math.max(5, profile.score - 10),
                status: profile.score < 55 ? "AT_RISK" : "IN_PROGRESS",
              },
            ],
      onboardingDelayed:
        profile.lifecycleKey === "onboarding" && index % 5 === 0,
    });
    await transaction.renewal.create({
      data: {
        id: stableUuid(`renewal:${profile.externalKey}:current`),
        workspaceId: input.workspaceId,
        customerId: customerIds[index],
        ownerId: owners[index],
        contractValue: profile.contractValue,
        currency: profile.currency,
        startAt: dateOnly(addDays(renewalAt, -365)),
        renewalAt,
        stage: stages[index % stages.length],
        readinessStatus: readiness.status as
          "HEALTHY" | "NEEDS_ATTENTION" | "AT_RISK" | null,
        readinessPending: false,
        readinessReasons: readiness.reasons,
        readinessCalculatedAt: offset <= 60 ? input.now : null,
        expectedOutcome:
          profile.score >= 85 && index % 4 === 0
            ? "EXPAND"
            : profile.score < 40
              ? "CONTRACT"
              : "RENEW",
        notes:
          profile.score < 60
            ? "Commercial review depends on the active recovery plan."
            : "Value review and stakeholder alignment are progressing.",
      },
    });
    await transaction.customer.update({
      where: { id: customerIds[index] },
      data: { renewalDate: renewalAt },
    });
  }
}

async function seedTasks(
  transaction: Prisma.TransactionClient,
  input: { workspaceId: string; now: Date; members: Members },
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
  owners: string[],
) {
  await transaction.task.createMany({
    data: profiles.flatMap((profile, customerIndex) =>
      Array.from({ length: profile.taskCount }, (_, taskIndex) => {
        const status = (
          ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const
        )[(customerIndex + taskIndex) % 4];
        const completed = status === "COMPLETED";
        const dueOffset =
          taskIndex === 0 && profile.score < 60
            ? -8
            : [-3, 0, 1, 5, 12, 30][taskIndex % 6];
        return {
          id: stableUuid(`task:${profile.externalKey}:${taskIndex}`),
          workspaceId: input.workspaceId,
          customerId: customerIds[customerIndex],
          title: taskTitles[(customerIndex + taskIndex) % taskTitles.length],
          description:
            "A concrete customer-success follow-up with a clear owner and due date.",
          ownerId: owners[customerIndex],
          createdById:
            taskIndex % 4 === 0
              ? input.members.managerId
              : owners[customerIndex],
          priority: (["LOW", "MEDIUM", "HIGH", "URGENT"] as const)[
            (customerIndex + taskIndex) % 4
          ],
          status,
          dueDate: dateOnly(addDays(input.now, dueOffset)),
          completedAt: completed ? addDays(input.now, -2 - taskIndex) : null,
          completedById: completed ? owners[customerIndex] : null,
          createdAt: addDays(input.now, -20 - taskIndex * 3),
        };
      }),
    ),
  });
}

async function seedPlaybookRuns(
  transaction: Prisma.TransactionClient,
  input: { workspaceId: string; now: Date },
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
  owners: string[],
) {
  const examples = [
    [1, "at-risk-recovery", "ACTIVE"],
    [4, "onboarding-recovery", "ACTIVE"],
    [5, "low-engagement", "DISMISSED"],
    [6, "at-risk-recovery", "COMPLETED"],
    [8, "renewal-preparation", "COMPLETED"],
    [11, "renewal-preparation", "ACTIVE"],
  ] as const;
  for (const [profileIndex, templateKey, status] of examples) {
    const template = await transaction.playbookTemplate.findFirstOrThrow({
      where: {
        workspaceId: input.workspaceId,
        key: templateKey,
        isActive: true,
      },
      orderBy: { version: "desc" },
      include: { steps: { orderBy: { position: "asc" } } },
    });
    const profile = profiles[profileIndex];
    const runId = stableUuid(
      `playbook-run:${profile.externalKey}:${templateKey}`,
    );
    await transaction.playbookRun.create({
      data: {
        id: runId,
        workspaceId: input.workspaceId,
        customerId: customerIds[profileIndex],
        templateId: template.id,
        templateVersion: template.version,
        ownerId: owners[profileIndex],
        status,
        startedAt: addDays(input.now, -18),
        completedAt: status === "COMPLETED" ? addDays(input.now, -3) : null,
        dismissedReason:
          status === "DISMISSED"
            ? "Customer priorities changed after the recovery review."
            : null,
      },
    });
    for (const step of template.steps) {
      const taskId = stableUuid(
        `playbook-task:${profile.externalKey}:${templateKey}:${step.position}`,
      );
      const taskStatus =
        status === "COMPLETED"
          ? "COMPLETED"
          : status === "DISMISSED"
            ? "CANCELLED"
            : step.position === 1
              ? "COMPLETED"
              : step.position === 2
                ? "IN_PROGRESS"
                : "OPEN";
      await transaction.task.create({
        data: {
          id: taskId,
          workspaceId: input.workspaceId,
          customerId: customerIds[profileIndex],
          title: step.title,
          description: step.description,
          ownerId: owners[profileIndex],
          createdById: owners[profileIndex],
          priority: profile.score < 60 ? "HIGH" : "MEDIUM",
          status: taskStatus,
          dueDate: dateOnly(addDays(input.now, step.dueOffsetDays - 10)),
          completedAt:
            taskStatus === "COMPLETED" ? addDays(input.now, -3) : null,
          completedById:
            taskStatus === "COMPLETED" ? owners[profileIndex] : null,
          playbookRunId: runId,
          createdAt: addDays(input.now, -18),
        },
      });
      await transaction.playbookStep.create({
        data: {
          id: stableUuid(
            `playbook-step:${profile.externalKey}:${templateKey}:${step.position}`,
          ),
          workspaceId: input.workspaceId,
          customerId: customerIds[profileIndex],
          playbookRunId: runId,
          title: step.title,
          description: step.description,
          position: step.position,
          status:
            taskStatus === "CANCELLED"
              ? "CANCELLED"
              : taskStatus === "COMPLETED"
                ? "COMPLETED"
                : taskStatus,
          taskId,
          completedAt:
            taskStatus === "COMPLETED" ? addDays(input.now, -3) : null,
        },
      });
    }
  }
}

async function seedSystemEvents(
  transaction: Prisma.TransactionClient,
  input: { workspaceId: string; now: Date },
  profiles: ReturnType<typeof buildCustomerProfiles>,
  customerIds: string[],
  owners: string[],
) {
  await transaction.systemEvent.createMany({
    data: profiles.flatMap((profile, index) => {
      const count = index < 15 ? 8 : 2;
      return Array.from({ length: count }, (_, eventIndex) => ({
        id: stableUuid(`event:${profile.externalKey}:${eventIndex}`),
        workspaceId: input.workspaceId,
        customerId: customerIds[index],
        type: eventIndex % 2 === 0 ? "CUSTOMER_UPDATED" : "HEALTH_CHANGED",
        title:
          eventIndex % 2 === 0
            ? "Customer profile updated"
            : "Health score recalculated",
        entityType: eventIndex % 2 === 0 ? "CUSTOMER" : "CUSTOMER_HEALTH",
        entityId:
          eventIndex % 2 === 0
            ? customerIds[index]
            : stableUuid(`customer-health:${profile.externalKey}`),
        actorId: owners[index],
        occurredAt: addDays(input.now, -15 - eventIndex * 9),
        metadata: { version: 1, seed: true, scenario: profile.scenario },
        idempotencyKey: `seed:${profile.externalKey}:event:${eventIndex}`,
      }));
    }),
  });
}

async function reconcileAndSummarize(
  prisma: PrismaClient,
  workspaceId: string,
  expectedCustomers: number,
  now: Date,
) {
  const [
    customers,
    contacts,
    activities,
    tasks,
    risks,
    onboardings,
    renewals,
    notes,
    healthGroups,
  ] = await Promise.all([
    prisma.customer.count({ where: { workspaceId } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.activity.count({ where: { workspaceId } }),
    prisma.task.count({ where: { workspaceId } }),
    prisma.risk.count({ where: { workspaceId } }),
    prisma.onboarding.count({ where: { workspaceId } }),
    prisma.renewal.count({ where: { workspaceId } }),
    prisma.activity.count({ where: { workspaceId, type: "NOTE" } }),
    prisma.customerHealth.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: true,
    }),
  ]);
  if (customers !== expectedCustomers)
    throw new Error(
      `Expected ${expectedCustomers} customers, found ${customers}`,
    );
  const lifecycle = await prisma.lifecycleStage.findMany({
    where: { workspaceId },
    select: { key: true, _count: { select: { customers: true } } },
  });
  const duplicatePrimary = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`SELECT count(*) AS count FROM (SELECT "customerId" FROM "contact" WHERE "workspaceId" = CAST(${workspaceId} AS uuid) AND "isPrimary" AND "status" = 'ACTIVE' GROUP BY "customerId" HAVING count(*) > 1) duplicates`;
  if (Number(duplicatePrimary[0]?.count ?? 0) > 0)
    throw new Error("Seed created duplicate active primary contacts");
  const renewalWindows = await prisma.renewal.count({
    where: {
      workspaceId,
      stage: { notIn: ["RENEWED", "CHURNED"] },
      renewalAt: { gte: dateOnly(now), lte: dateOnly(addDays(now, 90)) },
    },
  });
  return {
    customers,
    contacts,
    activities,
    notes,
    tasks,
    risks,
    onboardings,
    renewals,
    renewalWindows,
    health: Object.fromEntries(
      healthGroups.map((group) => [group.status ?? "UNKNOWN", group._count]),
    ),
    lifecycle: Object.fromEntries(
      lifecycle.map((stage) => [stage.key, stage._count.customers]),
    ),
  };
}

export function printSeedSummary(
  summary: Awaited<ReturnType<typeof reconcileAndSummarize>>,
  users: number,
) {
  console.info("\nWaslix seed completed\n");
  console.info(`Users: ${users} existing users preserved`);
  console.info(`Customers: ${summary.customers}`);
  console.info(`Contacts: ${summary.contacts}`);
  console.info(`Activities: ${summary.activities} (${summary.notes} notes)`);
  console.info(`Tasks: ${summary.tasks}`);
  console.info(`Risks: ${summary.risks}`);
  console.info(`Onboardings: ${summary.onboardings}`);
  console.info(`Renewals: ${summary.renewals}`);
  console.info(`Health: ${JSON.stringify(summary.health)}`);
  console.info(`Lifecycle: ${JSON.stringify(summary.lifecycle)}`);
  console.info(`Renewals in next 90 days: ${summary.renewalWindows}`);
}
