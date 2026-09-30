-- Extend membership lifecycle.
ALTER TYPE "MembershipStatus" ADD VALUE IF NOT EXISTS 'INVITED';
ALTER TYPE "MembershipStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- Create SaaS workspace and billing-placeholder enums.
DO $$ BEGIN
  CREATE TYPE "WorkspaceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE "WorkspacePlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'BUSINESS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE "WorkspaceSubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'CANCELED', 'PAST_DUE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Workspace ownership and onboarding state.
ALTER TABLE "workspace"
  ADD COLUMN IF NOT EXISTS "ownerId" UUID,
  ADD COLUMN IF NOT EXISTS "status" "WorkspaceStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT true;

UPDATE "workspace" w
SET "ownerId" = (
  SELECT wm."userId"
  FROM "workspace_member" wm
  WHERE wm."workspaceId" = w."id"
    AND wm."role" = 'ADMIN'
    AND wm."status" = 'ACTIVE'
  ORDER BY wm."joinedAt" ASC, wm."id" ASC
  LIMIT 1
)
WHERE w."ownerId" IS NULL;

CREATE INDEX IF NOT EXISTS "workspace_ownerId_idx" ON "workspace"("ownerId");
CREATE INDEX IF NOT EXISTS "workspace_status_onboardingCompleted_idx" ON "workspace"("status", "onboardingCompleted");
DO $$ BEGIN
  ALTER TABLE "workspace" ADD CONSTRAINT "workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Subscription placeholder foundation. No payment provider is connected here.
CREATE TABLE IF NOT EXISTS "workspace_subscription" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_subscription_workspaceId_key" ON "workspace_subscription"("workspaceId");
CREATE INDEX IF NOT EXISTS "workspace_subscription_plan_status_idx" ON "workspace_subscription"("plan", "status");
DO $$ BEGIN
  ALTER TABLE "workspace_subscription" ADD CONSTRAINT "workspace_subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

INSERT INTO "workspace_subscription" ("workspaceId", "plan", "status")
SELECT "id", 'FREE', 'ACTIVE'
FROM "workspace"
ON CONFLICT ("workspaceId") DO NOTHING;

-- Invitation token/status hardening.
ALTER TABLE "invitation" DROP CONSTRAINT IF EXISTS "invitation_status_check";
ALTER TABLE "invitation"
  ADD COLUMN IF NOT EXISTS "token" TEXT,
  ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "invitation"
SET "token" = md5(random()::text || clock_timestamp()::text || "id"::text) || md5("id"::text || random()::text)
WHERE "token" IS NULL;

ALTER TABLE "invitation" ALTER COLUMN "token" SET NOT NULL;
ALTER TABLE "invitation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "invitation" ALTER COLUMN "status" TYPE "InvitationStatus" USING (
  CASE lower("status")
    WHEN 'pending' THEN 'PENDING'
    WHEN 'accepted' THEN 'ACCEPTED'
    WHEN 'canceled' THEN 'REVOKED'
    WHEN 'rejected' THEN 'REVOKED'
    ELSE upper("status")
  END::"InvitationStatus"
);
ALTER TABLE "invitation" ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE UNIQUE INDEX IF NOT EXISTS "invitation_token_key" ON "invitation"("token");
CREATE INDEX IF NOT EXISTS "invitation_status_expiresAt_idx" ON "invitation"("status", "expiresAt");
