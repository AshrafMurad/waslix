import { PgBoss } from "pg-boss";
import { z } from "zod";

import { dispatchOutboxBatch } from "@/lib/jobs/dispatch-outbox";
import {
  recalculateCustomerHealth,
  runDailyHealthSweep,
} from "@/modules/health/services/recalculate-customer-health";
import { refreshCustomerIntelligence } from "@/modules/signals/services/refresh-customer-intelligence";

const healthJobSchema = z.object({
  workspaceId: z.uuid(),
  customerId: z.uuid(),
  eventKey: z.string().min(1),
});
const intelligenceJobSchema = healthJobSchema.extend({
  customerId: z.uuid().nullable(),
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
  await boss.createQueue("TASK_CHANGED", { policy: "key_strict_fifo" });
  await boss.createQueue("INTELLIGENCE_REFRESH", { policy: "key_strict_fifo" });
  const queues = new Set([
    healthQueue,
    dailyQueue,
    "TASK_CHANGED",
    "INTELLIGENCE_REFRESH",
  ]);
  await boss.work<unknown>(healthQueue, async (jobs) => {
    for (const job of jobs) {
      const payload = healthJobSchema.parse(job.data);
      await recalculateCustomerHealth({
        workspaceId: payload.workspaceId,
        customerId: payload.customerId,
      });
      await refreshCustomerIntelligence(
        payload.workspaceId,
        payload.customerId,
      );
    }
  });
  const refreshIntelligence = async (jobs: Array<{ data: unknown }>) => {
    for (const job of jobs) {
      const payload = intelligenceJobSchema.parse(job.data);
      if (!payload.customerId) continue;
      await refreshCustomerIntelligence(
        payload.workspaceId,
        payload.customerId,
      );
    }
  };
  await boss.work<unknown>("TASK_CHANGED", refreshIntelligence);
  await boss.work<unknown>("INTELLIGENCE_REFRESH", refreshIntelligence);
  await boss.work(dailyQueue, async () => {
    await runDailyHealthSweep();
    const { prisma } = await import("@/lib/db/prisma");
    const customers = await prisma.customer.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, workspaceId: true },
    });
    for (const customer of customers)
      await refreshCustomerIntelligence(customer.workspaceId, customer.id);
  });
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
