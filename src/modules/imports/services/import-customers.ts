import "server-only";

import { Prisma, type ImportRowStatus } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { updateRenewalReadiness } from "@/modules/renewals/services/manage-renewal";

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

type ImportMapping = Partial<Record<ImportColumn, string>>;

type ValidationRow = {
  rowNumber: number;
  data: NormalizedImportRow;
  ownerId: string | undefined;
  stageId: string | undefined;
  errors: string[];
};

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

function localDate(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function defaultMapping(headers: string[]): ImportMapping {
  const supported = new Set(importColumns);
  return Object.fromEntries(
    headers
      .map((header) => [header, header.trim().toLowerCase()] as const)
      .filter(([, header]) => supported.has(header as ImportColumn))
      .map(([source, column]) => [column, source]),
  ) as ImportMapping;
}

function parseMapping(value: FormDataEntryValue | null, headers: string[]) {
  if (typeof value !== "string" || !value.trim())
    return defaultMapping(headers);
  const parsed = JSON.parse(value) as Record<string, unknown>;
  const headerSet = new Set(headers);
  const mapping: ImportMapping = {};
  for (const column of importColumns) {
    const source = parsed[column];
    if (typeof source === "string" && source && headerSet.has(source)) {
      mapping[column] = source;
    }
  }
  return mapping;
}

function rowError(rowNumber: number, code: string) {
  return { rowNumber, code };
}

async function validateRows(
  access: WorkspaceAccessContext,
  rawRows: string[][],
  mapping: ImportMapping,
) {
  const headers = rawRows[0];
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const [workspace, owners, stages, existingExternalKeys, existingCustomers] =
    await Promise.all([
      prisma.workspace.findUniqueOrThrow({
        where: { id: access.workspaceId },
        select: { defaultCurrency: true, timezone: true },
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

  const validationRows: ValidationRow[] = rawRows
    .slice(1)
    .map((cells, index) => {
      const data: NormalizedImportRow = {};
      for (const column of importColumns) {
        const source = mapping[column];
        const cellIndex = source ? headerIndex.get(source) : undefined;
        const value =
          cellIndex === undefined ? undefined : cells[cellIndex]?.trim();
        if (value) data[column] = value;
      }
      const rowNumber = index + 2;
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
      if (
        data.contract_value &&
        (!/^\d+(\.\d{1,2})?$/.test(data.contract_value) ||
          Number(data.contract_value) < 0)
      )
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
      return { rowNumber, data, ownerId, stageId, errors };
    });

  return { workspace, rows: validationRows };
}

async function createValidationRevision(
  access: WorkspaceAccessContext,
  csv: string,
  mappingValue: FormDataEntryValue | null,
) {
  if (access.role !== "ADMIN") {
    return { ok: false as const, code: "IMPORT_FORBIDDEN" };
  }
  if (Buffer.byteLength(csv, "utf8") > 5 * 1024 * 1024) {
    return { ok: false as const, code: "IMPORT_FILE_TOO_LARGE" };
  }

  const rawRows = parseCsv(csv);
  if (rawRows.length < 2) return { ok: false as const, code: "IMPORT_EMPTY" };
  if (rawRows.length > 5001)
    return { ok: false as const, code: "IMPORT_TOO_MANY_ROWS" };
  const headers = rawRows[0].map((header) => header.trim());
  let mapping: ImportMapping;
  try {
    mapping = parseMapping(mappingValue, headers);
  } catch {
    return { ok: false as const, code: "IMPORT_MAPPING_INVALID" };
  }
  if (!mapping.customer_name) {
    return { ok: false as const, code: "IMPORT_CUSTOMER_NAME_UNMAPPED" };
  }
  const unsupported = Object.keys(mapping).filter(
    (column) => !importColumns.includes(column as ImportColumn),
  );
  if (unsupported.length) {
    return {
      ok: false as const,
      code: "IMPORT_UNSUPPORTED_COLUMNS",
      unsupported,
    };
  }

  const validation = await validateRows(access, rawRows, mapping);
  const hasErrors = validation.rows.some((row) => row.errors.length);
  const result = await prisma.$transaction(async (transaction) => {
    const batch = await transaction.importBatch.create({
      data: {
        workspaceId: access.workspaceId,
        createdById: access.memberId,
        status: hasErrors ? "VALIDATING" : "READY",
        totalRows: validation.rows.length,
      },
    });
    const revision = await transaction.importValidation.create({
      data: {
        workspaceId: access.workspaceId,
        batchId: batch.id,
        version: 1,
        mapping: { columns: mapping, sourceHeaders: headers },
        status: hasErrors ? "INVALID" : "READY",
      },
    });
    await transaction.importBatch.update({
      where: { id: batch.id },
      data: { currentValidationId: revision.id },
    });
    await transaction.importRow.createMany({
      data: validation.rows.map((row) => ({
        workspaceId: access.workspaceId,
        batchId: batch.id,
        validationId: revision.id,
        rowNumber: row.rowNumber,
        normalizedData: row.data,
        status: row.errors.length ? "INVALID" : "PENDING",
        errors: row.errors.map((code) => rowError(row.rowNumber, code)),
      })),
    });
    return { batch, revision };
  });

  return {
    ok: true as const,
    mode: "validated" as const,
    batchId: result.batch.id,
    validationId: result.revision.id,
    headers,
    mapping,
    totalRows: validation.rows.length,
    succeededRows: 0,
    failedRows: validation.rows.filter((row) => row.errors.length).length,
    skippedRows: 0,
    errors: validation.rows.flatMap((row) =>
      row.errors.map((code) => rowError(row.rowNumber, code)),
    ),
    ready: !hasErrors,
  };
}

async function executeValidationRevision(
  access: WorkspaceAccessContext,
  validationId: string,
  importValidRows: boolean,
  now = new Date(),
) {
  if (access.role !== "ADMIN") {
    return { ok: false as const, code: "IMPORT_FORBIDDEN" };
  }
  const validation = await prisma.importValidation.findFirst({
    where: { id: validationId, workspaceId: access.workspaceId },
    include: { batch: { select: { id: true } } },
  });
  if (!validation) return { ok: false as const, code: "IMPORT_NOT_FOUND" };
  const invalidCount = await prisma.importRow.count({
    where: { workspaceId: access.workspaceId, validationId, status: "INVALID" },
  });
  if (invalidCount && !importValidRows) {
    return { ok: false as const, code: "IMPORT_HAS_INVALID_ROWS" };
  }

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: access.workspaceId },
    select: { defaultCurrency: true, timezone: true },
  });
  const pendingRows = await prisma.importRow.findMany({
    where: {
      workspaceId: access.workspaceId,
      validationId,
      status: { in: ["PENDING", "FAILED"] },
    },
    orderBy: { rowNumber: "asc" },
  });
  await prisma.importBatch.update({
    where: { id: validation.batchId },
    data: { status: "RUNNING", startedAt: now },
  });

  for (const importRow of pendingRows) {
    const row = importRow.normalizedData as NormalizedImportRow;
    try {
      const outcome = await prisma.$transaction(async (transaction) => {
        if (row.external_key) {
          const existing = await transaction.customer.findFirst({
            where: {
              workspaceId: access.workspaceId,
              externalKey: normalizeKey(row.external_key),
            },
            select: { id: true },
          });
          if (existing) {
            await transaction.importRow.update({
              where: { id: importRow.id },
              data: { status: "SKIPPED", customerId: existing.id, errors: [] },
            });
            return "SKIPPED" as const;
          }
        }
        const owner = row.owner_email
          ? await transaction.workspaceMember.findFirst({
              where: {
                workspaceId: access.workspaceId,
                status: "ACTIVE",
                role: { in: ["ADMIN", "CS_MANAGER", "CSM"] },
                user: {
                  email: { equals: row.owner_email, mode: "insensitive" },
                },
              },
              select: { id: true },
            })
          : { id: access.memberId };
        const stage = await transaction.lifecycleStage.findFirst({
          where: {
            workspaceId: access.workspaceId,
            isActive: true,
            key: row.lifecycle_stage_key ?? "new",
          },
          select: { id: true },
        });
        if (!owner || !stage) throw new Error("validated_reference_missing");
        const customer = await transaction.customer.create({
          data: {
            workspaceId: access.workspaceId,
            name: row.customer_name!,
            externalKey: normalizeKey(row.external_key),
            website: row.website,
            industry: row.industry,
            companySize: row.company_size ? Number(row.company_size) : null,
            contractValue: row.contract_value
              ? new Prisma.Decimal(row.contract_value)
              : null,
            currency: row.currency ?? workspace.defaultCurrency,
            customerSince: row.customer_since
              ? new Date(`${row.customer_since}T00:00:00.000Z`)
              : null,
            renewalDate: row.renewal_date
              ? new Date(`${row.renewal_date}T00:00:00.000Z`)
              : null,
            lifecycleStageId: stage.id,
            ownerId: owner.id,
          },
        });
        if (row.primary_contact_name) {
          await transaction.contact.create({
            data: {
              workspaceId: access.workspaceId,
              customerId: customer.id,
              name: row.primary_contact_name,
              email: row.primary_contact_email,
              jobTitle: row.primary_contact_role,
              accountRole: (row.primary_contact_role ?? "OTHER") as never,
              isPrimary: true,
            },
          });
        }
        for (const tagName of (row.tags ?? "")
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
              customerId: customer.id,
              tagId: tag.id,
            },
          });
        }
        if (row.renewal_date && row.contract_value) {
          const renewal = await transaction.renewal.create({
            data: {
              workspaceId: access.workspaceId,
              customerId: customer.id,
              ownerId: owner.id,
              contractValue: new Prisma.Decimal(row.contract_value),
              currency: row.currency ?? workspace.defaultCurrency,
              renewalAt: new Date(`${row.renewal_date}T00:00:00.000Z`),
              stage: "UPCOMING",
            },
            select: { id: true },
          });
          await updateRenewalReadiness(
            transaction,
            access.workspaceId,
            customer.id,
            renewal.id,
            localDate(now, workspace.timezone),
            now,
          );
        }
        await transaction.importRow.update({
          where: { id: importRow.id },
          data: { status: "IMPORTED", customerId: customer.id, errors: [] },
        });
        return "IMPORTED" as const;
      });
      void outcome;
    } catch {
      await prisma.importRow.update({
        where: { id: importRow.id },
        data: {
          status: "FAILED",
          errors: [rowError(importRow.rowNumber, "row_import_failed")],
        },
      });
    }
  }

  const counts = await prisma.importRow.groupBy({
    by: ["status"],
    where: { workspaceId: access.workspaceId, validationId },
    _count: true,
  });
  const count = (status: ImportRowStatus) =>
    counts.find((item) => item.status === status)?._count ?? 0;
  const completed = await prisma.importBatch.update({
    where: { id: validation.batchId },
    data: {
      status: count("FAILED") || count("INVALID") ? "FAILED" : "COMPLETED",
      succeededRows: count("IMPORTED"),
      failedRows: count("FAILED") + count("INVALID"),
      skippedRows: count("SKIPPED"),
      completedAt: new Date(),
    },
  });

  return {
    ok: true as const,
    mode: "executed" as const,
    batchId: completed.id,
    validationId,
    totalRows: completed.totalRows,
    succeededRows: completed.succeededRows,
    failedRows: completed.failedRows,
    skippedRows: completed.skippedRows,
    errors: await prisma.importRow
      .findMany({
        where: {
          workspaceId: access.workspaceId,
          validationId,
          status: { in: ["INVALID", "FAILED"] },
        },
        orderBy: { rowNumber: "asc" },
        select: { errors: true },
      })
      .then((rows) => rows.flatMap((row) => row.errors as unknown[])),
  };
}

export async function importCustomersFromCsv(
  access: WorkspaceAccessContext,
  csv: string,
  options: {
    mapping?: FormDataEntryValue | null;
    execute?: boolean;
    importValidRows?: boolean;
  } = {},
) {
  const validation = await createValidationRevision(
    access,
    csv,
    options.mapping ?? null,
  );
  if (!validation.ok || !options.execute) return validation;
  if (!validation.ready && !options.importValidRows) {
    return {
      ...validation,
      ok: false as const,
      code: "IMPORT_HAS_INVALID_ROWS",
    };
  }
  return executeValidationRevision(
    access,
    validation.validationId,
    Boolean(options.importValidRows),
  );
}

export async function retryCustomerImport(
  access: WorkspaceAccessContext,
  validationId: string,
  importValidRows = true,
) {
  return executeValidationRevision(access, validationId, importValidRows);
}
