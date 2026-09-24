import { PrismaClient } from "@prisma/client";

import { seedTwoWorkspaceFixture } from "../tests/fixtures/two-workspaces";

const prisma = new PrismaClient();

try {
  const fixture = await seedTwoWorkspaceFixture(prisma);
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
} finally {
  await prisma.$disconnect();
}
