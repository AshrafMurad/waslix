import { PrismaClient } from "@prisma/client";

import { seedTwoWorkspaceFixture } from "../tests/fixtures/two-workspaces";
import { printSeedSummary, seedDemoPortfolio } from "./seeds/portfolio";

function seedNow() {
  const value = process.env.SEED_NOW?.trim() ?? "2026-09-29T09:00:00.000Z";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new Error("SEED_NOW must be an ISO-8601 date-time");
  return date;
}

async function main() {
  const prisma = new PrismaClient();
  const configuredFixturePassword = process.env.SEED_FIXTURE_PASSWORD?.trim();
  const fixturePassword =
    process.env.NODE_ENV === "production"
      ? configuredFixturePassword
      : (configuredFixturePassword ?? "123456");
  if (!fixturePassword)
    throw new Error("SEED_FIXTURE_PASSWORD is required in production");

  try {
    // User definitions remain owned by the established auth-compatible fixture.
    const fixture = await seedTwoWorkspaceFixture(prisma, fixturePassword);
    const summary = await seedDemoPortfolio(prisma, {
      workspaceId: fixture.workspaceA.id,
      stageIds: new Map(
        fixture.alphaStages.map((stage) => [stage.key, stage.id]),
      ),
      members: {
        adminId: fixture.memberships.alphaAdmin.id,
        managerId: fixture.memberships.alphaManager.id,
        csmId: fixture.memberships.alphaCsm.id,
      },
      now: seedNow(),
      randomSeed: process.env.SEED_RANDOM_SEED?.trim() || "waslix-demo-v2",
    });
    printSeedSummary(summary, Object.keys(fixture.users).length);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
