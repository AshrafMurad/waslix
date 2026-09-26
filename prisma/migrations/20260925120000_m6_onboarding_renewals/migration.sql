CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED','IN_PROGRESS','COMPLETED');
CREATE TYPE "RenewalStage" AS ENUM ('UPCOMING','PREPARING','DISCUSSION','NEGOTIATION','COMMITTED','RENEWED','CHURNED');
CREATE TYPE "RenewalReadinessStatus" AS ENUM ('HEALTHY','NEEDS_ATTENTION','AT_RISK');
CREATE TYPE "RenewalExpectedOutcome" AS ENUM ('UNKNOWN','RENEW','EXPAND','CONTRACT','CHURN');
CREATE TYPE "RenewalOutcome" AS ENUM ('RENEWED','EXPANDED','CONTRACTED','CHURNED');

ALTER TABLE "task" ADD COLUMN "renewalId" UUID;
ALTER TABLE "task" ADD COLUMN "milestoneId" UUID;

CREATE TABLE "onboarding" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL, "ownerId" UUID NOT NULL,
  "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED', "startDate" DATE, "targetCompletionDate" DATE, "completedAt" TIMESTAMPTZ(3),
  "adoptionDismissedForCompletedAt" TIMESTAMPTZ(3), "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "onboarding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_milestone" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL, "onboardingId" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL, "description" VARCHAR(10000), "ownerId" UUID NOT NULL, "position" INTEGER NOT NULL,
  "isCritical" BOOLEAN NOT NULL DEFAULT false, "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED', "dueDate" DATE,
  "completedAt" TIMESTAMPTZ(3), "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "onboarding_milestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "renewal" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL, "ownerId" UUID NOT NULL,
  "contractValue" DECIMAL(18,2) NOT NULL, "currency" CHAR(3) NOT NULL, "startAt" DATE, "renewalAt" DATE NOT NULL,
  "stage" "RenewalStage" NOT NULL DEFAULT 'UPCOMING', "readinessStatus" "RenewalReadinessStatus", "readinessPending" BOOLEAN NOT NULL DEFAULT false,
  "readinessReasons" JSONB NOT NULL DEFAULT '[]', "readinessCalculatedAt" TIMESTAMPTZ(3), "expectedOutcome" "RenewalExpectedOutcome",
  "outcome" "RenewalOutcome", "completedAt" TIMESTAMPTZ(3), "notes" VARCHAR(10000), "churnReason" VARCHAR(10000),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "renewal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "renewal_terminal_check" CHECK (("stage" IN ('RENEWED','CHURNED') AND "completedAt" IS NOT NULL AND "outcome" IS NOT NULL) OR ("stage" NOT IN ('RENEWED','CHURNED') AND "completedAt" IS NULL AND "outcome" IS NULL)),
  CONSTRAINT "renewal_outcome_check" CHECK (("stage" = 'RENEWED' AND "outcome" IN ('RENEWED','EXPANDED','CONTRACTED')) OR ("stage" = 'CHURNED' AND "outcome" = 'CHURNED') OR ("stage" NOT IN ('RENEWED','CHURNED') AND "outcome" IS NULL)),
  CONSTRAINT "renewal_value_check" CHECK ("contractValue" >= 0)
);

CREATE UNIQUE INDEX "onboarding_workspaceId_customerId_key" ON "onboarding"("workspaceId","customerId");
CREATE UNIQUE INDEX "onboarding_workspaceId_customerId_id_key" ON "onboarding"("workspaceId","customerId","id");
CREATE INDEX "onboarding_workspaceId_ownerId_status_idx" ON "onboarding"("workspaceId","ownerId","status");
CREATE UNIQUE INDEX "onboarding_milestone_workspaceId_customerId_id_key" ON "onboarding_milestone"("workspaceId","customerId","id");
CREATE UNIQUE INDEX "onboarding_milestone_workspaceId_onboardingId_position_key" ON "onboarding_milestone"("workspaceId","onboardingId","position");
CREATE INDEX "onboarding_milestone_workspaceId_ownerId_status_idx" ON "onboarding_milestone"("workspaceId","ownerId","status");
CREATE UNIQUE INDEX "renewal_workspaceId_customerId_id_key" ON "renewal"("workspaceId","customerId","id");
CREATE UNIQUE INDEX "renewal_one_nonterminal_customer" ON "renewal"("workspaceId","customerId") WHERE "stage" NOT IN ('RENEWED','CHURNED');
CREATE INDEX "renewal_workspaceId_renewalAt_idx" ON "renewal"("workspaceId","renewalAt");
CREATE INDEX "renewal_workspaceId_stage_idx" ON "renewal"("workspaceId","stage");
CREATE INDEX "renewal_workspaceId_ownerId_stage_idx" ON "renewal"("workspaceId","ownerId","stage");
CREATE INDEX "task_workspaceId_renewalId_status_idx" ON "task"("workspaceId","renewalId","status");
CREATE INDEX "task_workspaceId_milestoneId_status_idx" ON "task"("workspaceId","milestoneId","status");

ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_owner_fkey" FOREIGN KEY ("workspaceId","ownerId") REFERENCES "workspace_member"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "onboarding_milestone" ADD CONSTRAINT "onboarding_milestone_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onboarding_milestone" ADD CONSTRAINT "onboarding_milestone_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "onboarding_milestone" ADD CONSTRAINT "onboarding_milestone_onboarding_fkey" FOREIGN KEY ("workspaceId","customerId","onboardingId") REFERENCES "onboarding"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "onboarding_milestone" ADD CONSTRAINT "onboarding_milestone_owner_fkey" FOREIGN KEY ("workspaceId","ownerId") REFERENCES "workspace_member"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "renewal" ADD CONSTRAINT "renewal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "renewal" ADD CONSTRAINT "renewal_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "renewal" ADD CONSTRAINT "renewal_owner_fkey" FOREIGN KEY ("workspaceId","ownerId") REFERENCES "workspace_member"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_renewal_fkey" FOREIGN KEY ("workspaceId","customerId","renewalId") REFERENCES "renewal"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_milestone_fkey" FOREIGN KEY ("workspaceId","customerId","milestoneId") REFERENCES "onboarding_milestone"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
