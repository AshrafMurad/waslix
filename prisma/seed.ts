import { PrismaClient } from "@prisma/client";

import { seedTwoWorkspaceFixture } from "../tests/fixtures/two-workspaces";

const prisma = new PrismaClient();

try {
  await seedTwoWorkspaceFixture(prisma);
} finally {
  await prisma.$disconnect();
}
