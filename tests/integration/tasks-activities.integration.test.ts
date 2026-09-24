import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { dispatchOutboxBatch } from "@/lib/jobs/dispatch-outbox";
import { prisma } from "@/lib/db/prisma";
import { createActivity } from "@/modules/activities/services/create-activity";
import { createCustomer } from "@/modules/customers/services/manage-customer";
import {
  changeTaskStatus,
  createTask,
} from "@/modules/tasks/services/manage-task";
import { getCustomerTimeline } from "@/modules/timeline/queries/get-customer-timeline";
import { seedTwoWorkspaceFixture } from "../fixtures/two-workspaces";

describe("tasks, activities, and timeline", () => {
  let fixture: Awaited<ReturnType<typeof seedTwoWorkspaceFixture>>;
  let customerId: string;
  const managerAccess = () => ({
    userId: fixture.users.manager.id,
    workspaceId: fixture.workspaceA.id,
    memberId: fixture.memberships.alphaManager.id,
    role: "CS_MANAGER" as const,
  });
  const csmAccess = () => ({
    userId: fixture.users.csm.id,
    workspaceId: fixture.workspaceA.id,
    memberId: fixture.memberships.alphaCsm.id,
    role: "CSM" as const,
  });

  beforeAll(async () => {
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
    fixture = await seedTwoWorkspaceFixture(prisma);
    const customer = await createCustomer(managerAccess(), {
      name: "M3 Customer",
      website: null,
      industry: null,
      companySize: null,
      contractValue: null,
      currency: "SAR",
      customerSince: null,
      renewalDate: null,
      lifecycleStageId: fixture.alphaStages[0].id,
      ownerId: fixture.memberships.alphaManager.id,
      tags: [],
    });
    customerId = customer.id;
  });

  afterAll(async () => prisma.$disconnect());

  it("completes an assigned task atomically and deduplicates a retry", async () => {
    const createKey = randomUUID();
    const task = await createTask(managerAccess(), {
      customerId,
      title: "Prepare customer review",
      description: null,
      ownerId: fixture.memberships.alphaCsm.id,
      priority: "HIGH",
      dueDate: "2026-09-30",
      dueAt: null,
      operationKey: createKey,
    });
    await expect(
      createTask(managerAccess(), {
        customerId,
        title: "Prepare customer review",
        description: null,
        ownerId: fixture.memberships.alphaCsm.id,
        priority: "HIGH",
        dueDate: "2026-09-30",
        dueAt: null,
        operationKey: createKey,
      }),
    ).resolves.toEqual(task);

    const completionKey = randomUUID();
    const completedAt = new Date("2026-09-24T12:00:00.000Z");
    await changeTaskStatus(
      csmAccess(),
      { taskId: task.id, status: "COMPLETED", operationKey: completionKey },
      completedAt,
    );
    await changeTaskStatus(
      csmAccess(),
      { taskId: task.id, status: "COMPLETED", operationKey: completionKey },
      completedAt,
    );

    await expect(
      prisma.task.findUniqueOrThrow({ where: { id: task.id } }),
    ).resolves.toMatchObject({
      status: "COMPLETED",
      completedAt,
      completedById: fixture.memberships.alphaCsm.id,
    });
    await expect(
      prisma.systemEvent.count({
        where: {
          workspaceId: fixture.workspaceA.id,
          idempotencyKey: completionKey,
        },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.jobOutbox.count({
        where: { workspaceId: fixture.workspaceA.id, eventKey: completionKey },
      }),
    ).resolves.toBe(1);
  });

  it("rejects cross-workspace task access without disclosing the record", async () => {
    const task = await createTask(managerAccess(), {
      customerId,
      title: "Tenant scoped task",
      description: null,
      ownerId: fixture.memberships.alphaManager.id,
      priority: "MEDIUM",
      dueDate: null,
      dueAt: null,
      operationKey: randomUUID(),
    });
    await expect(
      changeTaskStatus(
        {
          userId: fixture.users.tenantBAdmin.id,
          workspaceId: fixture.workspaceB.id,
          memberId: fixture.memberships.betaAdmin.id,
          role: "ADMIN",
        },
        { taskId: task.id, status: "COMPLETED", operationKey: randomUUID() },
      ),
    ).rejects.toMatchObject({ code: "TASK_NOT_FOUND" });
  });

  it("keeps human activity distinct and updates meaningful contact recency", async () => {
    const contact = await prisma.contact.create({
      data: {
        workspaceId: fixture.workspaceA.id,
        customerId,
        name: "Timeline Contact",
      },
    });
    const occurredAt = new Date("2026-09-23T08:30:00.000Z");
    const activity = await createActivity(managerAccess(), {
      customerId,
      type: "CALL",
      title: "Quarterly check-in",
      description: "Reviewed adoption progress.",
      contactId: contact.id,
      occurredAt,
      isMeaningful: true,
      operationKey: randomUUID(),
    });
    const note = await createActivity(managerAccess(), {
      customerId,
      type: "NOTE",
      title: "Internal context",
      description: null,
      contactId: contact.id,
      occurredAt: new Date("2026-09-24T08:30:00.000Z"),
      isMeaningful: true,
      operationKey: randomUUID(),
    });

    await expect(
      prisma.contact.findUniqueOrThrow({ where: { id: contact.id } }),
    ).resolves.toMatchObject({
      lastInteractionAt: occurredAt,
    });
    await expect(
      prisma.activity.findUniqueOrThrow({ where: { id: note.id } }),
    ).resolves.toMatchObject({
      isMeaningful: false,
    });
    const timeline = await getCustomerTimeline(managerAccess(), customerId);
    expect(
      timeline?.entries.some(
        (entry) => entry.id === activity.id && entry.kind === "activity",
      ),
    ).toBe(true);
    expect(timeline?.entries.some((entry) => entry.kind === "system")).toBe(
      true,
    );
  });

  it("redelivers with a stable event key so replay has one durable effect", async () => {
    const eventKey = randomUUID();
    const task = await createTask(managerAccess(), {
      customerId,
      title: "Replay-safe task",
      description: null,
      ownerId: fixture.memberships.alphaManager.id,
      priority: "LOW",
      dueDate: null,
      dueAt: null,
      operationKey: eventKey,
    });
    const durableEffects = new Set<string>();
    let targetDeliveries = 0;
    const send = async (delivery: { eventKey: string }) => {
      if (delivery.eventKey === eventKey) {
        targetDeliveries += 1;
        durableEffects.add(delivery.eventKey);
      }
    };
    await dispatchOutboxBatch(send);
    await prisma.jobOutbox.updateMany({
      where: { workspaceId: fixture.workspaceA.id, eventKey },
      data: { dispatchedAt: null },
    });
    await dispatchOutboxBatch(send);

    expect(task.id).toBeTruthy();
    expect(targetDeliveries).toBe(2);
    expect(durableEffects.size).toBe(1);
  });
});
