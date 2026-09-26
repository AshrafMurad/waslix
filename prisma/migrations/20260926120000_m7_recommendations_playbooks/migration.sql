CREATE TYPE "RecommendationStatus" AS ENUM ('SUGGESTED','ACCEPTED','COMPLETED','DISMISSED');
CREATE TYPE "RecommendationType" AS ENUM ('REVIEW_HEALTH','SCHEDULE_CHECK_IN','START_PLAYBOOK','FOLLOW_UP','CREATE_MITIGATION','REVIEW_SUPPORT','REVIEW_GOALS','COMPLETE_TASK');
CREATE TYPE "PlaybookTriggerType" AS ENUM ('AT_RISK_RECOVERY','RENEWAL_PREPARATION','ONBOARDING_RECOVERY','LOW_ENGAGEMENT');
CREATE TYPE "PlaybookRunStatus" AS ENUM ('ACTIVE','COMPLETED','DISMISSED');
CREATE TYPE "PlaybookStepStatus" AS ENUM ('OPEN','IN_PROGRESS','COMPLETED','CANCELLED');

ALTER TABLE "task" ADD COLUMN "playbookRunId" UUID;

CREATE TABLE "recommendation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL, "signalId" UUID,
  "ruleKey" "SignalRuleKey" NOT NULL, "episodeKey" UUID NOT NULL, "type" "RecommendationType" NOT NULL,
  "title" VARCHAR(200) NOT NULL, "reason" VARCHAR(10000) NOT NULL, "priority" "Severity" NOT NULL,
  "status" "RecommendationStatus" NOT NULL DEFAULT 'SUGGESTED', "taskId" UUID, "playbookRunId" UUID,
  "completedAt" TIMESTAMPTZ(3), "dismissedReason" VARCHAR(10000),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "recommendation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "recommendation_target_check" CHECK (("taskId" IS NULL) OR ("playbookRunId" IS NULL)),
  CONSTRAINT "recommendation_completed_check" CHECK (("status" = 'COMPLETED' AND "completedAt" IS NOT NULL) OR ("status" <> 'COMPLETED' AND "completedAt" IS NULL)),
  CONSTRAINT "recommendation_dismissed_check" CHECK (("status" = 'DISMISSED' AND "dismissedReason" IS NOT NULL) OR ("status" <> 'DISMISSED'))
);

CREATE TABLE "playbook_template" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "key" VARCHAR(100) NOT NULL,
  "name" VARCHAR(200) NOT NULL, "description" VARCHAR(10000) NOT NULL, "triggerType" "PlaybookTriggerType" NOT NULL,
  "version" INTEGER NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "playbook_template_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "playbook_template_step" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "templateId" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL, "description" VARCHAR(10000), "position" INTEGER NOT NULL, "dueOffsetDays" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "playbook_template_step_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "playbook_run" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL, "templateId" UUID NOT NULL,
  "templateVersion" INTEGER NOT NULL, "ownerId" UUID NOT NULL, "riskId" UUID, "status" "PlaybookRunStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMPTZ(3), "dismissedReason" VARCHAR(10000),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "playbook_run_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "playbook_run_completed_check" CHECK (("status" = 'COMPLETED' AND "completedAt" IS NOT NULL) OR ("status" <> 'COMPLETED' AND "completedAt" IS NULL)),
  CONSTRAINT "playbook_run_dismissed_check" CHECK (("status" = 'DISMISSED' AND "dismissedReason" IS NOT NULL) OR ("status" <> 'DISMISSED'))
);

CREATE TABLE "playbook_step" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL, "playbookRunId" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL, "description" VARCHAR(10000), "position" INTEGER NOT NULL, "status" "PlaybookStepStatus" NOT NULL DEFAULT 'OPEN',
  "taskId" UUID NOT NULL, "completedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "playbook_step_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "playbook_step_completed_check" CHECK (("status" = 'COMPLETED' AND "completedAt" IS NOT NULL) OR ("status" <> 'COMPLETED' AND "completedAt" IS NULL))
);

CREATE UNIQUE INDEX "recommendation_workspace_customer_rule_episode_key" ON "recommendation"("workspaceId","customerId","ruleKey","episodeKey");
CREATE UNIQUE INDEX "recommendation_workspace_task_key" ON "recommendation"("workspaceId","taskId") WHERE "taskId" IS NOT NULL;
CREATE UNIQUE INDEX "recommendation_workspace_run_key" ON "recommendation"("workspaceId","playbookRunId") WHERE "playbookRunId" IS NOT NULL;
CREATE UNIQUE INDEX "recommendation_workspace_customer_run_key" ON "recommendation"("workspaceId","customerId","playbookRunId") WHERE "playbookRunId" IS NOT NULL;
CREATE INDEX "recommendation_workspace_customer_status_priority_idx" ON "recommendation"("workspaceId","customerId","status","priority");
CREATE UNIQUE INDEX "playbook_template_workspace_key_version_key" ON "playbook_template"("workspaceId","key","version");
CREATE UNIQUE INDEX "playbook_template_workspace_id_key" ON "playbook_template"("workspaceId","id");
CREATE INDEX "playbook_template_workspace_key_active_idx" ON "playbook_template"("workspaceId","key","isActive");
CREATE UNIQUE INDEX "playbook_template_step_workspace_template_position_key" ON "playbook_template_step"("workspaceId","templateId","position");
CREATE UNIQUE INDEX "playbook_run_workspace_customer_id_key" ON "playbook_run"("workspaceId","customerId","id");
CREATE UNIQUE INDEX "playbook_run_one_active_template_customer" ON "playbook_run"("workspaceId","customerId","templateId") WHERE "status" = 'ACTIVE';
CREATE INDEX "playbook_run_workspace_owner_status_idx" ON "playbook_run"("workspaceId","ownerId","status");
CREATE UNIQUE INDEX "playbook_step_workspace_run_position_key" ON "playbook_step"("workspaceId","playbookRunId","position");
CREATE UNIQUE INDEX "playbook_step_workspace_task_key" ON "playbook_step"("workspaceId","taskId");
CREATE INDEX "playbook_step_workspace_customer_status_idx" ON "playbook_step"("workspaceId","customerId","status");
CREATE INDEX "task_workspaceId_playbookRunId_status_idx" ON "task"("workspaceId","playbookRunId","status");

ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_signal_fkey" FOREIGN KEY ("workspaceId","customerId","signalId") REFERENCES "signal"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_task_fkey" FOREIGN KEY ("workspaceId","taskId") REFERENCES "task"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "playbook_template" ADD CONSTRAINT "playbook_template_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "playbook_template_step" ADD CONSTRAINT "playbook_template_step_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "playbook_template_step" ADD CONSTRAINT "playbook_template_step_template_fkey" FOREIGN KEY ("workspaceId","templateId") REFERENCES "playbook_template"("workspaceId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "playbook_run" ADD CONSTRAINT "playbook_run_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "playbook_run" ADD CONSTRAINT "playbook_run_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "playbook_run" ADD CONSTRAINT "playbook_run_template_fkey" FOREIGN KEY ("workspaceId","templateId") REFERENCES "playbook_template"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "playbook_run" ADD CONSTRAINT "playbook_run_owner_fkey" FOREIGN KEY ("workspaceId","ownerId") REFERENCES "workspace_member"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "playbook_run" ADD CONSTRAINT "playbook_run_risk_fkey" FOREIGN KEY ("workspaceId","customerId","riskId") REFERENCES "risk"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_playbook_run_fkey" FOREIGN KEY ("workspaceId","customerId","playbookRunId") REFERENCES "playbook_run"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "playbook_step" ADD CONSTRAINT "playbook_step_workspace_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "playbook_step" ADD CONSTRAINT "playbook_step_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "playbook_step" ADD CONSTRAINT "playbook_step_run_fkey" FOREIGN KEY ("workspaceId","customerId","playbookRunId") REFERENCES "playbook_run"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "playbook_step" ADD CONSTRAINT "playbook_step_task_fkey" FOREIGN KEY ("workspaceId","taskId") REFERENCES "task"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_run_fkey" FOREIGN KEY ("workspaceId","customerId","playbookRunId") REFERENCES "playbook_run"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
