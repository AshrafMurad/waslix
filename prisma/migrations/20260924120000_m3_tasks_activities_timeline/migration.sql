CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "ActivityType" AS ENUM ('MEETING', 'CALL', 'EMAIL', 'NOTE');

CREATE TABLE "task" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID,
  "title" VARCHAR(200) NOT NULL, "description" VARCHAR(10000), "ownerId" UUID NOT NULL, "createdById" UUID NOT NULL,
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM', "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
  "dueDate" DATE, "dueAt" TIMESTAMPTZ(3), "completedAt" TIMESTAMPTZ(3), "completedById" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "task_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_due_exclusivity_check" CHECK (NOT ("dueDate" IS NOT NULL AND "dueAt" IS NOT NULL)),
  CONSTRAINT "task_completion_consistency_check" CHECK (("status" = 'COMPLETED') = ("completedAt" IS NOT NULL AND "completedById" IS NOT NULL))
);

CREATE TABLE "activity" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL,
  "type" "ActivityType" NOT NULL, "title" VARCHAR(200) NOT NULL, "description" VARCHAR(10000), "contactId" UUID,
  "createdById" UUID NOT NULL, "occurredAt" TIMESTAMPTZ(3) NOT NULL, "isMeaningful" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "activity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "activity_note_not_meaningful_check" CHECK ("type" <> 'NOTE' OR NOT "isMeaningful")
);

CREATE TABLE "system_event" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID,
  "type" VARCHAR(100) NOT NULL, "title" VARCHAR(200) NOT NULL, "entityType" VARCHAR(100) NOT NULL, "entityId" UUID NOT NULL, "actorId" UUID,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "metadata" JSONB NOT NULL, "idempotencyKey" VARCHAR(200) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "system_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_outbox" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "eventKey" VARCHAR(200) NOT NULL,
  "jobType" VARCHAR(100) NOT NULL, "customerId" UUID, "payload" JSONB NOT NULL,
  "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "dispatchedAt" TIMESTAMPTZ(3),
  "attempts" INTEGER NOT NULL DEFAULT 0, "lastErrorCode" VARCHAR(100),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "job_outbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_workspaceId_id_key" ON "task"("workspaceId", "id");
CREATE INDEX "task_workspaceId_ownerId_status_idx" ON "task"("workspaceId", "ownerId", "status");
CREATE INDEX "task_workspaceId_status_dueDate_idx" ON "task"("workspaceId", "status", "dueDate");
CREATE INDEX "task_workspaceId_status_dueAt_idx" ON "task"("workspaceId", "status", "dueAt");
CREATE INDEX "task_workspaceId_customerId_idx" ON "task"("workspaceId", "customerId");
CREATE UNIQUE INDEX "activity_workspaceId_customerId_id_key" ON "activity"("workspaceId", "customerId", "id");
CREATE INDEX "activity_workspaceId_customerId_occurredAt_id_idx" ON "activity"("workspaceId", "customerId", "occurredAt", "id");
CREATE UNIQUE INDEX "system_event_workspaceId_idempotencyKey_key" ON "system_event"("workspaceId", "idempotencyKey");
CREATE INDEX "system_event_workspaceId_customerId_occurredAt_id_idx" ON "system_event"("workspaceId", "customerId", "occurredAt", "id");
CREATE UNIQUE INDEX "job_outbox_workspaceId_eventKey_key" ON "job_outbox"("workspaceId", "eventKey");
CREATE INDEX "job_outbox_dispatchedAt_availableAt_idx" ON "job_outbox"("dispatchedAt", "availableAt");

ALTER TABLE "task" ADD CONSTRAINT "task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_workspaceId_ownerId_fkey" FOREIGN KEY ("workspaceId", "ownerId") REFERENCES "workspace_member"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_workspaceId_createdById_fkey" FOREIGN KEY ("workspaceId", "createdById") REFERENCES "workspace_member"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_workspaceId_completedById_fkey" FOREIGN KEY ("workspaceId", "completedById") REFERENCES "workspace_member"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "activity" ADD CONSTRAINT "activity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity" ADD CONSTRAINT "activity_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "activity" ADD CONSTRAINT "activity_workspaceId_customerId_contactId_fkey" FOREIGN KEY ("workspaceId", "customerId", "contactId") REFERENCES "contact"("workspaceId", "customerId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "activity" ADD CONSTRAINT "activity_workspaceId_createdById_fkey" FOREIGN KEY ("workspaceId", "createdById") REFERENCES "workspace_member"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "system_event" ADD CONSTRAINT "system_event_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "system_event" ADD CONSTRAINT "system_event_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "system_event" ADD CONSTRAINT "system_event_workspaceId_actorId_fkey" FOREIGN KEY ("workspaceId", "actorId") REFERENCES "workspace_member"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_outbox" ADD CONSTRAINT "job_outbox_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_outbox" ADD CONSTRAINT "job_outbox_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
