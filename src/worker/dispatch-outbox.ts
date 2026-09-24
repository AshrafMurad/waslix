import { PgBoss } from "pg-boss";

import { dispatchOutboxBatch } from "@/lib/jobs/dispatch-outbox";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const boss = new PgBoss(connectionString);
  boss.on("error", (error) => console.error("pg-boss error", error.name));
  await boss.start();
  const queues = new Set<string>();
  try {
    const result = await dispatchOutboxBatch(async (delivery) => {
      if (!queues.has(delivery.jobType)) {
        await boss.createQueue(delivery.jobType);
        queues.add(delivery.jobType);
      }
      await boss.send(delivery.jobType, delivery.payload as object, {
        singletonKey: delivery.eventKey,
        retryLimit: 5,
        retryBackoff: true,
      });
    });
    console.log(
      `Dispatched ${result.dispatched} of ${result.selected} outbox jobs.`,
    );
  } finally {
    await boss.stop();
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Worker failed");
    process.exitCode = 1;
  })
  .finally(async () => prismaDisconnect());

async function prismaDisconnect() {
  const { prisma } = await import("@/lib/db/prisma");
  await prisma.$disconnect();
}
