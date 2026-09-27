CREATE TYPE "ImportBatchStatus" AS ENUM ('VALIDATING', 'READY', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "ImportValidationStatus" AS ENUM ('VALIDATING', 'READY', 'INVALID', 'SUPERSEDED');
CREATE TYPE "ImportRowStatus" AS ENUM ('PENDING', 'INVALID', 'IMPORTED', 'SKIPPED', 'FAILED');

CREATE TABLE "import_batch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "fileKey" VARCHAR(500),
    "currentValidationId" UUID,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'VALIDATING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "succeededRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "import_batch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_validation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "mapping" JSONB NOT NULL,
    "status" "ImportValidationStatus" NOT NULL DEFAULT 'VALIDATING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "import_validation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_row" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "validationId" UUID NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "normalizedData" JSONB NOT NULL,
    "status" "ImportRowStatus" NOT NULL DEFAULT 'PENDING',
    "errors" JSONB,
    "customerId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "import_row_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "import_batch_workspaceId_id_key" ON "import_batch"("workspaceId", "id");
CREATE INDEX "import_batch_workspaceId_status_createdAt_idx" ON "import_batch"("workspaceId", "status", "createdAt");
CREATE UNIQUE INDEX "import_validation_workspaceId_batchId_version_key" ON "import_validation"("workspaceId", "batchId", "version");
CREATE UNIQUE INDEX "import_validation_workspaceId_id_key" ON "import_validation"("workspaceId", "id");
CREATE INDEX "import_validation_workspaceId_status_idx" ON "import_validation"("workspaceId", "status");
CREATE UNIQUE INDEX "import_row_workspaceId_validationId_rowNumber_key" ON "import_row"("workspaceId", "validationId", "rowNumber");
CREATE INDEX "import_row_workspaceId_batchId_status_idx" ON "import_row"("workspaceId", "batchId", "status");

ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_workspaceId_createdById_fkey" FOREIGN KEY ("workspaceId", "createdById") REFERENCES "workspace_member"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_validation" ADD CONSTRAINT "import_validation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_validation" ADD CONSTRAINT "import_validation_workspaceId_batchId_fkey" FOREIGN KEY ("workspaceId", "batchId") REFERENCES "import_batch"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_row" ADD CONSTRAINT "import_row_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_row" ADD CONSTRAINT "import_row_workspaceId_batchId_fkey" FOREIGN KEY ("workspaceId", "batchId") REFERENCES "import_batch"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_row" ADD CONSTRAINT "import_row_workspaceId_validationId_fkey" FOREIGN KEY ("workspaceId", "validationId") REFERENCES "import_validation"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_row" ADD CONSTRAINT "import_row_workspaceId_customerId_fkey" FOREIGN KEY ("workspaceId", "customerId") REFERENCES "customer"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
