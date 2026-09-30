CREATE TABLE "workspace_currency" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "code" CHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_currency_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workspace_currency_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "workspace_currency_workspaceId_code_key" ON "workspace_currency"("workspaceId", "code");
CREATE UNIQUE INDEX "workspace_currency_workspaceId_id_key" ON "workspace_currency"("workspaceId", "id");
CREATE INDEX "workspace_currency_workspaceId_isActive_code_idx" ON "workspace_currency"("workspaceId", "isActive", "code");
CREATE UNIQUE INDEX "workspace_currency_one_default_idx" ON "workspace_currency"("workspaceId") WHERE "isDefault" = true;

INSERT INTO "workspace_currency" ("workspaceId", "code", "name", "symbol", "decimalPlaces", "isActive", "isDefault")
SELECT
    "id",
    "defaultCurrency",
    CASE "defaultCurrency"
        WHEN 'USD' THEN 'US Dollar'
        WHEN 'SAR' THEN 'Saudi Riyal'
        WHEN 'AED' THEN 'UAE Dirham'
        WHEN 'EUR' THEN 'Euro'
        WHEN 'GBP' THEN 'British Pound'
        ELSE "defaultCurrency"
    END,
    CASE "defaultCurrency"
        WHEN 'USD' THEN '$'
        WHEN 'SAR' THEN 'ر.س'
        WHEN 'AED' THEN 'د.إ'
        WHEN 'EUR' THEN '€'
        WHEN 'GBP' THEN '£'
        ELSE "defaultCurrency"
    END,
    2,
    true,
    true
FROM "workspace"
ON CONFLICT ("workspaceId", "code") DO NOTHING;
