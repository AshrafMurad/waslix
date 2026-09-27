import { PrismaClient } from "@prisma/client";

import { serverEnvironment } from "@/config/server-env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: serverEnvironment.DATABASE_URL,
    log:
      serverEnvironment.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (serverEnvironment.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
