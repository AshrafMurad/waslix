CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ContactAccountRole" AS ENUM ('CHAMPION', 'DECISION_MAKER', 'EXECUTIVE_SPONSOR', 'ADMIN', 'BILLING', 'USER', 'OTHER');

CREATE TABLE "lifecycle_stage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "lifecycle_stage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "normalizedName" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "website" VARCHAR(500),
    "logoKey" VARCHAR(500),
    "industry" VARCHAR(200),
    "companySize" INTEGER,
    "contractValue" DECIMAL(18,2),
    "currency" CHAR(3) NOT NULL,
    "customerSince" DATE,
    "renewalDate" DATE,
    "lifecycleStageId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMPTZ(3),
    "externalKey" VARCHAR(200),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "customer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customer_contract_value_check" CHECK ("contractValue" IS NULL OR "contractValue" >= 0),
    CONSTRAINT "customer_company_size_check" CHECK ("companySize" IS NULL OR "companySize" >= 0),
    CONSTRAINT "customer_archive_consistency_check" CHECK (("status" = 'ARCHIVED') = ("archivedAt" IS NOT NULL))
);

CREATE TABLE "contact" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(320),
    "phone" VARCHAR(50),
    "jobTitle" VARCHAR(200),
    "accountRole" "ContactAccountRole" NOT NULL DEFAULT 'OTHER',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastInteractionAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "contact_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "contact_primary_active_check" CHECK (NOT "isPrimary" OR "status" = 'ACTIVE')
);

CREATE TABLE "customer_tag" (
    "workspaceId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_tag_pkey" PRIMARY KEY ("workspaceId", "customerId", "tagId")
);

CREATE UNIQUE INDEX "lifecycle_stage_workspaceId_key_key" ON "lifecycle_stage"("workspaceId", "key");
CREATE UNIQUE INDEX "lifecycle_stage_workspaceId_id_key" ON "lifecycle_stage"("workspaceId", "id");
CREATE INDEX "lifecycle_stage_workspaceId_isActive_position_idx" ON "lifecycle_stage"("workspaceId", "isActive", "position");
CREATE UNIQUE INDEX "tag_workspaceId_normalizedName_key" ON "tag"("workspaceId", "normalizedName");
CREATE UNIQUE INDEX "tag_workspaceId_id_key" ON "tag"("workspaceId", "id");
CREATE UNIQUE INDEX "customer_workspaceId_id_key" ON "customer"("workspaceId", "id");
CREATE UNIQUE INDEX "customer_workspaceId_externalKey_key" ON "customer"("workspaceId", "externalKey");
CREATE INDEX "customer_workspaceId_status_name_id_idx" ON "customer"("workspaceId", "status", "name", "id");
CREATE INDEX "customer_workspaceId_ownerId_status_idx" ON "customer"("workspaceId", "ownerId", "status");
CREATE INDEX "customer_workspaceId_lifecycleStageId_status_idx" ON "customer"("workspaceId", "lifecycleStageId", "status");
CREATE UNIQUE INDEX "contact_workspaceId_customerId_id_key" ON "contact"("workspaceId", "customerId", "id");
CREATE UNIQUE INDEX "contact_one_active_primary" ON "contact"("workspaceId", "customerId") WHERE "isPrimary" AND "status" = 'ACTIVE';
CREATE INDEX "contact_workspaceId_customerId_status_idx" ON "contact"("workspaceId", "customerId", "status");
CREATE INDEX "customer_tag_workspaceId_tagId_idx" ON "customer_tag"("workspaceId", "tagId");

ALTER TABLE "lifecycle_stage" ADD CONSTRAINT "lifecycle_stage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tag" ADD CONSTRAINT "tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer" ADD CONSTRAINT "customer_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer" ADD CONSTRAINT "customer_workspaceId_lifecycleStageId_fkey" FOREIGN KEY ("workspaceId", "lifecycleStageId") REFERENCES "lifecycle_stage"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer" ADD CONSTRAINT "customer_workspaceId_ownerId_fkey" FOREIGN KEY ("workspaceId", "ownerId") REFERENCES "workspace_member"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contact" ADD CONSTRAINT "contact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact" ADD CONSTRAINT "contact_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_tag" ADD CONSTRAINT "customer_tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_tag" ADD CONSTRAINT "customer_tag_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_tag" ADD CONSTRAINT "customer_tag_workspaceId_tagId_fkey" FOREIGN KEY ("workspaceId", "tagId") REFERENCES "tag"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
