import { PgBoss } from "pg-boss";
import { z } from "zod";

import { dispatchOutboxBatch } from "@/lib/jobs/dispatch-outbox";
import {
  recalculateCustomerHealth,
  runDailyHealthSweep,
} from "@/modules/health/services/recalculate-customer-health";

const healthJobSchema = z.object({
  workspaceId: z.uuid(),
  customerId: z.uuid(),
  eventKey: z.string().min(1),
});

const healthQueue = "HEALTH_RECALCULATE";
const dailyQueue = "HEALTH_DAILY_SWEEP";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const boss = new PgBoss(connectionString);
  boss.on("error", (error) => console.error("pg-boss error", error.name));
  await boss.start();
  await boss.createQueue(healthQueue, { policy: "key_strict_fifo" });
  await boss.createQueue(dailyQueue, { policy: "singleton" });
  const queues = new Set([healthQueue, dailyQueue]);
  await boss.work<unknown>(healthQueue, async (jobs) => {
    for (const job of jobs) {
      const payload = healthJobSchema.parse(job.data);
      await recalculateCustomerHealth({
        workspaceId: payload.workspaceId,
        customerId: payload.customerId,
      });
    }
  });
  await boss.work(dailyQueue, async () => runDailyHealthSweep());
  await boss.schedule(
    dailyQueue,
    "0 * * * *",
    {},
    { tz: "UTC", missed: "once" },
  );

  const dispatch = () =>
    dispatchOutboxBatch(async (delivery) => {
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
  await dispatch();
  const interval = setInterval(() => void dispatch(), 5 * 60 * 1000);
  await new Promise<void>((resolve) => {
    const stop = () => resolve();
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  });
  clearInterval(interval);
  await boss.stop({ graceful: true });
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Health worker failed",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.$disconnect();
  });
