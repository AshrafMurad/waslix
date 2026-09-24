CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'AT_RISK', 'ACHIEVED', 'CANCELLED');
CREATE TYPE "HealthDimension" AS ENUM ('USAGE', 'ENGAGEMENT', 'SUPPORT', 'GOALS');
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'NEEDS_ATTENTION', 'AT_RISK');
CREATE TYPE "HealthSourceType" AS ENUM ('MANUAL', 'SYSTEM', 'INTEGRATION');
CREATE TYPE "HealthConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

CREATE TABLE "success_goal" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL, "description" VARCHAR(10000), "ownerId" UUID NOT NULL, "progress" INTEGER NOT NULL DEFAULT 0,
  "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED', "targetDate" DATE, "progressObservedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ(3), "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "success_goal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "success_goal_progress_check" CHECK ("progress" BETWEEN 0 AND 100),
  CONSTRAINT "success_goal_completion_check" CHECK (("status" = 'ACHIEVED' AND "progress" = 100 AND "completedAt" IS NOT NULL) OR ("status" <> 'ACHIEVED' AND "completedAt" IS NULL))
);

CREATE TABLE "health_input" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL,
  "dimension" "HealthDimension" NOT NULL, "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "health_input_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "health_input_revision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL, "healthInputId" UUID NOT NULL,
  "version" INTEGER NOT NULL, "value" INTEGER NOT NULL, "sourceType" "HealthSourceType" NOT NULL, "sourceRef" VARCHAR(500),
  "isSimulated" BOOLEAN NOT NULL DEFAULT false, "observedAt" TIMESTAMPTZ(3) NOT NULL, "createdById" UUID, "evidence" JSONB,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "health_input_revision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "health_input_revision_value_check" CHECK ("value" BETWEEN 0 AND 100),
  CONSTRAINT "health_input_revision_version_check" CHECK ("version" > 0)
);

CREATE TABLE "customer_health" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL,
  "rawScore" DECIMAL(8,4), "overallScore" INTEGER, "status" "HealthStatus", "usageScore" INTEGER, "engagementScore" INTEGER,
  "supportScore" INTEGER, "goalScore" INTEGER, "confidence" "HealthConfidence" NOT NULL DEFAULT 'LOW',
  "confidenceValue" DECIMAL(5,4) NOT NULL DEFAULT 0, "calculatedAt" TIMESTAMPTZ(3) NOT NULL, "pendingSince" TIMESTAMPTZ(3),
  "calculationKey" VARCHAR(500) NOT NULL, "ruleVersion" VARCHAR(50) NOT NULL, "evidence" JSONB NOT NULL,
  CONSTRAINT "customer_health_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "customer_health_score_check" CHECK ("overallScore" IS NULL OR "overallScore" BETWEEN 0 AND 100)
);

CREATE TABLE "health_snapshot" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL,
  "rawScore" DECIMAL(8,4), "overallScore" INTEGER, "status" "HealthStatus", "usageScore" INTEGER, "engagementScore" INTEGER,
  "supportScore" INTEGER, "goalScore" INTEGER, "confidence" "HealthConfidence" NOT NULL, "confidenceValue" DECIMAL(5,4) NOT NULL,
  "snapshotAt" TIMESTAMPTZ(3) NOT NULL, "calculationKey" VARCHAR(500) NOT NULL, "ruleVersion" VARCHAR(50) NOT NULL, "evidence" JSONB NOT NULL,
  CONSTRAINT "health_snapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "health_snapshot_score_check" CHECK ("overallScore" IS NULL OR "overallScore" BETWEEN 0 AND 100)
);

CREATE UNIQUE INDEX "success_goal_workspaceId_id_key" ON "success_goal"("workspaceId", "id");
CREATE INDEX "success_goal_workspaceId_customerId_status_idx" ON "success_goal"("workspaceId", "customerId", "status");
CREATE INDEX "success_goal_workspaceId_ownerId_status_idx" ON "success_goal"("workspaceId", "ownerId", "status");
CREATE UNIQUE INDEX "health_input_workspaceId_customerId_dimension_key" ON "health_input"("workspaceId", "customerId", "dimension");
CREATE UNIQUE INDEX "health_input_workspaceId_customerId_id_key" ON "health_input"("workspaceId", "customerId", "id");
CREATE UNIQUE INDEX "health_input_revision_workspaceId_healthInputId_version_key" ON "health_input_revision"("workspaceId", "healthInputId", "version");
CREATE INDEX "health_input_revision_workspaceId_customerId_healthInputId_version_idx" ON "health_input_revision"("workspaceId", "customerId", "healthInputId", "version");
CREATE UNIQUE INDEX "customer_health_workspaceId_customerId_key" ON "customer_health"("workspaceId", "customerId");
CREATE UNIQUE INDEX "health_snapshot_workspaceId_customerId_calculationKey_key" ON "health_snapshot"("workspaceId", "customerId", "calculationKey");
CREATE INDEX "health_snapshot_workspaceId_customerId_snapshotAt_idx" ON "health_snapshot"("workspaceId", "customerId", "snapshotAt");

ALTER TABLE "success_goal" ADD CONSTRAINT "success_goal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "success_goal" ADD CONSTRAINT "success_goal_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "success_goal" ADD CONSTRAINT "success_goal_workspaceId_ownerId_fkey" FOREIGN KEY ("workspaceId", "ownerId") REFERENCES "workspace_member"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "health_input" ADD CONSTRAINT "health_input_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "health_input" ADD CONSTRAINT "health_input_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "health_input_revision" ADD CONSTRAINT "health_input_revision_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "health_input_revision" ADD CONSTRAINT "health_input_revision_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "health_input_revision" ADD CONSTRAINT "health_input_revision_parent_fkey" FOREIGN KEY ("workspaceId", "customerId", "healthInputId") REFERENCES "health_input"("workspaceId", "customerId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "health_input_revision" ADD CONSTRAINT "health_input_revision_workspaceId_createdById_fkey" FOREIGN KEY ("workspaceId", "createdById") REFERENCES "workspace_member"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_health" ADD CONSTRAINT "customer_health_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_health" ADD CONSTRAINT "customer_health_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "health_snapshot" ADD CONSTRAINT "health_snapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "health_snapshot" ADD CONSTRAINT "health_snapshot_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
