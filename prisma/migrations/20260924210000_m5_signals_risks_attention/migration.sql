CREATE TYPE "SignalRuleKey" AS ENUM ('HEALTH_LOW','HEALTH_DECLINE','LOW_ENGAGEMENT','RENEWAL_PREPARATION','RENEWAL_DUE','RENEWAL_RISK','ONBOARDING_DELAY','UNMANAGED_RISK','RISK_UNRESOLVED','TASK_OVERDUE','SUPPORT_ESCALATION','USAGE_DECLINE','GOAL_STALLED');
CREATE TYPE "SignalStatus" AS ENUM ('ACTIVE','RESOLVED','EXPIRED');
CREATE TYPE "Severity" AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
CREATE TYPE "AttentionStatus" AS ENUM ('OPEN','ACKNOWLEDGED','RESOLVED','DISMISSED');
CREATE TYPE "RiskType" AS ENUM ('USAGE','ENGAGEMENT','SUPPORT','STAKEHOLDER','ONBOARDING','RENEWAL','COMMERCIAL','OTHER');
CREATE TYPE "RiskStatus" AS ENUM ('OPEN','MONITORING','RESOLVED');

ALTER TABLE "task" ADD COLUMN "riskId" UUID;

CREATE TABLE "signal" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL,
  "type" "SignalRuleKey" NOT NULL, "ruleKey" "SignalRuleKey" NOT NULL, "ruleVersion" VARCHAR(50) NOT NULL,
  "subjectKey" VARCHAR(200) NOT NULL, "episodeKey" UUID NOT NULL, "severity" "Severity" NOT NULL,
  "title" VARCHAR(200) NOT NULL, "description" VARCHAR(10000), "currentValue" DECIMAL(18,4), "previousValue" DECIMAL(18,4),
  "sourceType" VARCHAR(50) NOT NULL, "sourceRef" VARCHAR(500), "isSimulated" BOOLEAN NOT NULL DEFAULT false,
  "evidence" JSONB NOT NULL, "detectedAt" TIMESTAMPTZ(3) NOT NULL, "lastEvaluatedAt" TIMESTAMPTZ(3) NOT NULL,
  "status" "SignalStatus" NOT NULL DEFAULT 'ACTIVE', "resolvedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "signal_pkey" PRIMARY KEY ("id"), CONSTRAINT "signal_type_rule_check" CHECK ("type" = "ruleKey")
);
CREATE TABLE "attention_item" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL,
  "priority" "Severity" NOT NULL, "status" "AttentionStatus" NOT NULL DEFAULT 'OPEN', "reasonSummary" VARCHAR(10000) NOT NULL,
  "evidenceSignature" VARCHAR(64) NOT NULL, "nearestDeadline" DATE, "dismissedSignature" VARCHAR(64), "dismissedPriority" "Severity",
  "dismissedReason" VARCHAR(10000), "actedById" UUID, "resolvedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "attention_item_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "attention_signal" (
  "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL, "attentionItemId" UUID NOT NULL, "signalId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attention_signal_pkey" PRIMARY KEY ("workspaceId","attentionItemId","signalId")
);
CREATE TABLE "risk" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL, "description" VARCHAR(10000), "type" "RiskType" NOT NULL, "severity" "Severity" NOT NULL,
  "ownerId" UUID NOT NULL, "status" "RiskStatus" NOT NULL DEFAULT 'OPEN', "targetResolutionDate" DATE,
  "resolvedAt" TIMESTAMPTZ(3), "resolutionNote" VARCHAR(10000),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "risk_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "risk_resolution_check" CHECK (("status" = 'RESOLVED' AND "resolvedAt" IS NOT NULL AND length(trim("resolutionNote")) > 0) OR ("status" <> 'RESOLVED' AND "resolvedAt" IS NULL AND "resolutionNote" IS NULL))
);
CREATE TABLE "risk_signal" (
  "workspaceId" UUID NOT NULL, "customerId" UUID NOT NULL, "riskId" UUID NOT NULL, "signalId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "risk_signal_pkey" PRIMARY KEY ("workspaceId","riskId","signalId")
);

CREATE UNIQUE INDEX "signal_workspaceId_customerId_id_key" ON "signal"("workspaceId","customerId","id");
CREATE UNIQUE INDEX "signal_one_active_rule_subject" ON "signal"("workspaceId","customerId","ruleKey","subjectKey") WHERE "status" = 'ACTIVE';
CREATE INDEX "signal_workspaceId_customerId_status_idx" ON "signal"("workspaceId","customerId","status");
CREATE UNIQUE INDEX "attention_item_workspaceId_customerId_id_key" ON "attention_item"("workspaceId","customerId","id");
CREATE UNIQUE INDEX "attention_one_active_customer" ON "attention_item"("workspaceId","customerId") WHERE "status" IN ('OPEN','ACKNOWLEDGED');
CREATE INDEX "attention_item_queue_idx" ON "attention_item"("workspaceId","status","priority","nearestDeadline","createdAt","id");
CREATE INDEX "attention_signal_workspaceId_customerId_idx" ON "attention_signal"("workspaceId","customerId");
CREATE UNIQUE INDEX "risk_workspaceId_customerId_id_key" ON "risk"("workspaceId","customerId","id");
CREATE INDEX "risk_workspaceId_status_severity_targetResolutionDate_id_idx" ON "risk"("workspaceId","status","severity","targetResolutionDate","id");
CREATE INDEX "risk_workspaceId_ownerId_status_idx" ON "risk"("workspaceId","ownerId","status");
CREATE INDEX "risk_signal_workspaceId_customerId_idx" ON "risk_signal"("workspaceId","customerId");
CREATE INDEX "task_workspaceId_riskId_status_idx" ON "task"("workspaceId","riskId","status");

ALTER TABLE "signal" ADD CONSTRAINT "signal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "signal" ADD CONSTRAINT "signal_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attention_item" ADD CONSTRAINT "attention_item_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attention_item" ADD CONSTRAINT "attention_item_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attention_item" ADD CONSTRAINT "attention_item_actor_fkey" FOREIGN KEY ("workspaceId","actedById") REFERENCES "workspace_member"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attention_signal" ADD CONSTRAINT "attention_signal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attention_signal" ADD CONSTRAINT "attention_signal_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attention_signal" ADD CONSTRAINT "attention_signal_item_fkey" FOREIGN KEY ("workspaceId","customerId","attentionItemId") REFERENCES "attention_item"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attention_signal" ADD CONSTRAINT "attention_signal_signal_fkey" FOREIGN KEY ("workspaceId","customerId","signalId") REFERENCES "signal"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "risk" ADD CONSTRAINT "risk_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "risk" ADD CONSTRAINT "risk_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "risk" ADD CONSTRAINT "risk_owner_fkey" FOREIGN KEY ("workspaceId","ownerId") REFERENCES "workspace_member"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "risk_signal" ADD CONSTRAINT "risk_signal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "risk_signal" ADD CONSTRAINT "risk_signal_customer_fkey" FOREIGN KEY ("workspaceId","customerId") REFERENCES "customer"("workspaceId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "risk_signal" ADD CONSTRAINT "risk_signal_risk_fkey" FOREIGN KEY ("workspaceId","customerId","riskId") REFERENCES "risk"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "risk_signal" ADD CONSTRAINT "risk_signal_signal_fkey" FOREIGN KEY ("workspaceId","customerId","signalId") REFERENCES "signal"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_risk_fkey" FOREIGN KEY ("workspaceId","customerId","riskId") REFERENCES "risk"("workspaceId","customerId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
