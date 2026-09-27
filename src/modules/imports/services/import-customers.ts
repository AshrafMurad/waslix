import "server-only";

import { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

const importColumns = [
  "customer_name",
  "external_key",
  "website",
  "industry",
  "company_size",
  "owner_email",
  "lifecycle_stage_key",
  "contract_value",
  "currency",
  "customer_since",
  "renewal_date",
  "primary_contact_name",
  "primary_contact_email",
  "primary_contact_role",
  "tags",
] as const;

type ImportColumn = (typeof importColumns)[number];
type NormalizedImportRow = Partial<Record<ImportColumn, string>>;

const contactRoles = new Set([
  "CHAMPION",
  "DECISION_MAKER",
  "EXECUTIVE_SPONSOR",
  "ADMIN",
  "BILLING",
  "USER",
  "OTHER",
]);

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function isIsoDate(value: string | undefined) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeKey(value: string | undefined) {
  return value?.trim().toLowerCase() || undefined;
}

function normalizeWebsite(value: string | undefined) {
  return value
    ?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

export async function importCustomersFromCsv(
  access: WorkspaceAccessContext,
  csv: string,
) {
  if (access.role !== "ADMIN") {
    return { ok: false as const, code: "IMPORT_FORBIDDEN" };
  }
  if (Buffer.byteLength(csv, "utf8") > 5 * 1024 * 1024) {
    return { ok: false as const, code: "IMPORT_FILE_TOO_LARGE" };
  }

  const rows = parseCsv(csv);
  if (rows.length < 2) return { ok: false as const, code: "IMPORT_EMPTY" };
  if (rows.length > 5001)
    return { ok: false as const, code: "IMPORT_TOO_MANY_ROWS" };

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const unsupported = headers.filter(
    (header) => !importColumns.includes(header as ImportColumn),
  );
  if (unsupported.length) {
    return {
      ok: false as const,
      code: "IMPORT_UNSUPPORTED_COLUMNS",
      unsupported,
    };
  }

  const [workspace, owners, stages, existingExternalKeys, existingCustomers] =
    await Promise.all([
      prisma.workspace.findUniqueOrThrow({
        where: { id: access.workspaceId },
        select: { defaultCurrency: true },
      }),
      prisma.workspaceMember.findMany({
        where: {
          workspaceId: access.workspaceId,
          status: "ACTIVE",
          role: { in: ["ADMIN", "CS_MANAGER", "CSM"] },
        },
        select: { id: true, user: { select: { email: true } } },
      }),
      prisma.lifecycleStage.findMany({
        where: { workspaceId: access.workspaceId, isActive: true },
        select: { id: true, key: true },
      }),
      prisma.customer.findMany({
        where: { workspaceId: access.workspaceId, externalKey: { not: null } },
        select: { externalKey: true },
      }),
      prisma.customer.findMany({
        where: { workspaceId: access.workspaceId },
        select: { name: true, website: true },
      }),
    ]);

  const ownersByEmail = new Map(
    owners.map((owner) => [owner.user.email.toLowerCase(), owner.id]),
  );
  const stagesByKey = new Map(stages.map((stage) => [stage.key, stage.id]));
  const seenExternalKeys = new Set<string>();
  const existingKeys = new Set(
    existingExternalKeys
      .map((customer) => customer.externalKey)
      .filter(Boolean),
  );
  const existingNameWebsite = new Set(
    existingCustomers.map(
      (customer) =>
        `${customer.name.trim().toLowerCase()}|${normalizeWebsite(customer.website ?? undefined) ?? ""}`,
    ),
  );

  const normalizedRows = rows.slice(1).map((cells, index) => {
    const data: NormalizedImportRow = {};
    headers.forEach((header, cellIndex) => {
      const value = cells[cellIndex]?.trim();
      if (value) data[header as ImportColumn] = value;
    });
    const errors: string[] = [];
    if (!data.customer_name) errors.push("customer_name_required");
    const ownerId = data.owner_email
      ? ownersByEmail.get(data.owner_email.toLowerCase())
      : access.memberId;
    if (!ownerId) errors.push("owner_email_unknown");
    const stageId = stagesByKey.get(data.lifecycle_stage_key ?? "new");
    if (!stageId) errors.push("lifecycle_stage_unknown");
    if (data.external_key) {
      const key = normalizeKey(data.external_key)!;
      if (seenExternalKeys.has(key) || existingKeys.has(key))
        errors.push("external_key_duplicate");
      seenExternalKeys.add(key);
    } else if (data.customer_name) {
      const collisionKey = `${data.customer_name.trim().toLowerCase()}|${normalizeWebsite(data.website) ?? ""}`;
      if (existingNameWebsite.has(collisionKey))
        errors.push("name_website_duplicate");
      existingNameWebsite.add(collisionKey);
    }
    if (data.company_size && !/^\d+$/.test(data.company_size))
      errors.push("company_size_invalid");
    if (data.contract_value && Number(data.contract_value) < 0)
      errors.push("contract_value_invalid");
    if (data.currency && !/^[A-Z]{3}$/.test(data.currency))
      errors.push("currency_invalid");
    if (!isIsoDate(data.customer_since) || !isIsoDate(data.renewal_date))
      errors.push("date_invalid");
    if (
      data.primary_contact_role &&
      !contactRoles.has(data.primary_contact_role)
    ) {
      errors.push("primary_contact_role_invalid");
    }
    const hasRenewalValue = Boolean(data.contract_value);
    const hasRenewalDate = Boolean(data.renewal_date);
    if (hasRenewalValue !== hasRenewalDate)
      errors.push("initial_renewal_incomplete");

    return {
      rowNumber: index + 2,
      data,
      ownerId,
      stageId,
      errors,
    };
  });

  const result = await prisma.$transaction(async (transaction) => {
    const batch = await transaction.importBatch.create({
      data: {
        workspaceId: access.workspaceId,
        createdById: access.memberId,
        status: "RUNNING",
        totalRows: normalizedRows.length,
        startedAt: new Date(),
      },
    });
    const validation = await transaction.importValidation.create({
      data: {
        workspaceId: access.workspaceId,
        batchId: batch.id,
        version: 1,
        mapping: { columns: headers },
        status: normalizedRows.some((row) => row.errors.length)
          ? "INVALID"
          : "READY",
      },
    });
    await transaction.importBatch.update({
      where: { id: batch.id },
      data: { currentValidationId: validation.id },
    });

    let succeededRows = 0;
    let failedRows = 0;
    const skippedRows = 0;
    for (const row of normalizedRows) {
      if (row.errors.length) {
        failedRows += 1;
        await transaction.importRow.create({
          data: {
            workspaceId: access.workspaceId,
            batchId: batch.id,
            validationId: validation.id,
            rowNumber: row.rowNumber,
            normalizedData: row.data,
            status: "INVALID",
            errors: row.errors,
          },
        });
        continue;
      }
      const data = row.data;
      const created = await transaction.customer.create({
        data: {
          workspaceId: access.workspaceId,
          name: data.customer_name!,
          externalKey: normalizeKey(data.external_key),
          website: data.website,
          industry: data.industry,
          companySize: data.company_size ? Number(data.company_size) : null,
          contractValue: data.contract_value
            ? new Prisma.Decimal(data.contract_value)
            : null,
          currency: data.currency ?? workspace.defaultCurrency,
          customerSince: data.customer_since
            ? new Date(`${data.customer_since}T00:00:00.000Z`)
            : null,
          renewalDate: data.renewal_date
            ? new Date(`${data.renewal_date}T00:00:00.000Z`)
            : null,
          lifecycleStageId: row.stageId!,
          ownerId: row.ownerId!,
        },
      });
      if (data.primary_contact_name) {
        await transaction.contact.create({
          data: {
            workspaceId: access.workspaceId,
            customerId: created.id,
            name: data.primary_contact_name,
            email: data.primary_contact_email,
            jobTitle: data.primary_contact_role,
            accountRole: (data.primary_contact_role ?? "OTHER") as never,
            isPrimary: true,
          },
        });
      }
      for (const tagName of (data.tags ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)) {
        const tag = await transaction.tag.upsert({
          where: {
            workspaceId_normalizedName: {
              workspaceId: access.workspaceId,
              normalizedName: tagName.toLowerCase(),
            },
          },
          update: { name: tagName },
          create: {
            workspaceId: access.workspaceId,
            name: tagName,
            normalizedName: tagName.toLowerCase(),
          },
        });
        await transaction.customerTag.create({
          data: {
            workspaceId: access.workspaceId,
            customerId: created.id,
            tagId: tag.id,
          },
        });
      }
      if (data.renewal_date && data.contract_value) {
        await transaction.renewal.create({
          data: {
            workspaceId: access.workspaceId,
            customerId: created.id,
            ownerId: row.ownerId!,
            contractValue: new Prisma.Decimal(data.contract_value),
            currency: data.currency ?? workspace.defaultCurrency,
            renewalAt: new Date(`${data.renewal_date}T00:00:00.000Z`),
            stage: "UPCOMING",
          },
        });
      }
      succeededRows += 1;
      await transaction.importRow.create({
        data: {
          workspaceId: access.workspaceId,
          batchId: batch.id,
          validationId: validation.id,
          rowNumber: row.rowNumber,
          normalizedData: data,
          status: "IMPORTED",
          customerId: created.id,
        },
      });
    }
    const completed = await transaction.importBatch.update({
      where: { id: batch.id },
      data: {
        status: failedRows && !succeededRows ? "FAILED" : "COMPLETED",
        succeededRows,
        failedRows,
        skippedRows,
        completedAt: new Date(),
      },
    });
    return completed;
  });

  return {
    ok: true as const,
    batchId: result.id,
    totalRows: result.totalRows,
    succeededRows: result.succeededRows,
    failedRows: result.failedRows,
    skippedRows: result.skippedRows,
  };
}
