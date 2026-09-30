-- Extend membership lifecycle.
ALTER TYPE "MembershipStatus" ADD VALUE IF NOT EXISTS 'INVITED';
ALTER TYPE "MembershipStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- Create SaaS workspace and billing-placeholder enums.
CREATE TYPE "WorkspaceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "WorkspacePlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'BUSINESS');
CREATE TYPE "WorkspaceSubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'CANCELED', 'PAST_DUE');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- Workspace ownership and onboarding state.
ALTER TABLE "workspace"
  ADD COLUMN "ownerId" UUID,
  ADD COLUMN "status" "WorkspaceStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT true;

UPDATE "workspace" w
SET "ownerId" = admin_member."userId"
FROM LATERAL (
  SELECT wm."userId"
  FROM "workspace_member" wm
  WHERE wm."workspaceId" = w."id"
    AND wm."role" = 'ADMIN'
    AND wm."status" = 'ACTIVE'
  ORDER BY wm."joinedAt" ASC, wm."id" ASC
  LIMIT 1
) admin_member;

CREATE INDEX "workspace_ownerId_idx" ON "workspace"("ownerId");
CREATE INDEX "workspace_status_onboardingCompleted_idx" ON "workspace"("status", "onboardingCompleted");
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Subscription placeholder foundation. No payment provider is connected here.
CREATE TABLE "workspace_subscription" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL,
  "plan" "WorkspacePlan" NOT NULL DEFAULT 'FREE',
  "status" "WorkspaceSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "trialEndsAt" TIMESTAMPTZ(3),
  "currentPeriodEnd" TIMESTAMPTZ(3),
  "externalCustomerId" TEXT,
  "externalSubscriptionId" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_subscription_workspaceId_key" ON "workspace_subscription"("workspaceId");
CREATE INDEX "workspace_subscription_plan_status_idx" ON "workspace_subscription"("plan", "status");
ALTER TABLE "workspace_subscription" ADD CONSTRAINT "workspace_subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "workspace_subscription" ("workspaceId", "plan", "status")
SELECT "id", 'FREE', 'ACTIVE'
FROM "workspace"
ON CONFLICT ("workspaceId") DO NOTHING;

-- Invitation token/status hardening.
ALTER TABLE "invitation" DROP CONSTRAINT IF EXISTS "invitation_status_check";
ALTER TABLE "invitation"
  ADD COLUMN "token" TEXT,
  ADD COLUMN "acceptedAt" TIMESTAMPTZ(3),
  ADD COLUMN "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "invitation"
SET "token" = encode(gen_random_bytes(32), 'hex')
WHERE "token" IS NULL;

ALTER TABLE "invitation" ALTER COLUMN "token" SET NOT NULL;
ALTER TABLE "invitation" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "invitation" ALTER COLUMN "status" TYPE "InvitationStatus" USING (
  CASE lower("status")
    WHEN 'pending' THEN 'PENDING'
    WHEN 'accepted' THEN 'ACCEPTED'
    WHEN 'canceled' THEN 'REVOKED'
    WHEN 'rejected' THEN 'REVOKED'
    ELSE upper("status")
  END::"InvitationStatus"
);

CREATE UNIQUE INDEX "invitation_token_key" ON "invitation"("token");
CREATE INDEX "invitation_status_expiresAt_idx" ON "invitation"("status", "expiresAt");
