import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { createActivity } from "@/modules/activities/services/create-activity";
import {
  archiveCustomer,
  createCustomer,
} from "@/modules/customers/services/manage-customer";
import {
  importCustomersFromCsv,
  retryCustomerImport,
} from "@/modules/imports/services/import-customers";
import { saveRisk } from "@/modules/risks/services/manage-risk";
import { globalSearch } from "@/modules/search/services/global-search";
import { createTask } from "@/modules/tasks/services/manage-task";
import { seedTwoWorkspaceFixture } from "../fixtures/two-workspaces";

describe("Phase 2 import and Customer 360 actions", () => {
  let fixture: Awaited<ReturnType<typeof seedTwoWorkspaceFixture>>;
  const adminAccess = () => ({
    userId: fixture.users.shared.id,
    workspaceId: fixture.workspaceA.id,
    memberId: fixture.memberships.alphaAdmin.id,
    role: "ADMIN" as const,
  });
  const viewerAccess = () => ({
    userId: fixture.users.viewer.id,
    workspaceId: fixture.workspaceA.id,
    memberId: fixture.memberships.alphaViewer.id,
    role: "VIEWER" as const,
  });
  const betaAccess = () => ({
    userId: fixture.users.tenantBAdmin.id,
    workspaceId: fixture.workspaceB.id,
    memberId: fixture.memberships.betaAdmin.id,
    role: "ADMIN" as const,
  });

  beforeAll(async () => {
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
    fixture = await seedTwoWorkspaceFixture(prisma);
  });

  afterAll(async () => prisma.$disconnect());

  it("validates all rows before commit and imports valid rows explicitly", async () => {
    const csv = [
      "Name,Key,Owner,Value,Renewal,Contact,Email,Tags",
      `Imported Alpha,alpha-1,${fixture.users.shared.email},12000,2026-10-20,Ada Admin,ada@example.test,Strategic`,
      `,alpha-2,${fixture.users.shared.email},9000,2026-10-21,Bad Row,bad@example.test,`,
    ].join("\n");
    const mapping = JSON.stringify({
      customer_name: "Name",
      external_key: "Key",
      owner_email: "Owner",
      contract_value: "Value",
      renewal_date: "Renewal",
      primary_contact_name: "Contact",
      primary_contact_email: "Email",
      tags: "Tags",
    });

    const blocked = await importCustomersFromCsv(adminAccess(), csv, {
      mapping,
      execute: true,
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.code).toBe("IMPORT_HAS_INVALID_ROWS");
    await expect(
      prisma.customer.count({
        where: { workspaceId: fixture.workspaceA.id, externalKey: "alpha-1" },
      }),
    ).resolves.toBe(0);
    expect("errors" in blocked ? blocked.errors : []).toContainEqual({
      rowNumber: 3,
      code: "customer_name_required",
    });

    const validationId =
      "validationId" in blocked ? blocked.validationId : null;
    expect(validationId).toBeTruthy();
    if (!validationId) throw new Error("validation id missing");
    const imported = await retryCustomerImport(
      adminAccess(),
      validationId,
      true,
    );
    expect(imported).toMatchObject({
      ok: true,
      succeededRows: 1,
      failedRows: 1,
      skippedRows: 0,
    });
    await expect(
      prisma.customer.count({
        where: { workspaceId: fixture.workspaceA.id, externalKey: "alpha-1" },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.renewal.findFirstOrThrow({
        where: {
          workspaceId: fixture.workspaceA.id,
          customer: { externalKey: "alpha-1" },
        },
      }),
    ).resolves.toMatchObject({
      readinessStatus: "NEEDS_ATTENTION",
      readinessPending: false,
    });

    const replay = await retryCustomerImport(adminAccess(), validationId, true);
    expect(replay).toMatchObject({
      ok: true,
      succeededRows: 1,
      failedRows: 1,
      skippedRows: 0,
    });
    await expect(
      prisma.customer.count({
        where: { workspaceId: fixture.workspaceA.id, externalKey: "alpha-1" },
      }),
    ).resolves.toBe(1);
  });

  it("keeps Customer 360 quick actions workspace-scoped and role/archive aware", async () => {
    const customer = await createCustomer(adminAccess(), {
      name: "Header Action Customer",
      website: null,
      industry: null,
      companySize: null,
      contractValue: null,
      currency: "SAR",
      customerSince: null,
      renewalDate: null,
      lifecycleStageId: fixture.alphaStages[0].id,
      ownerId: fixture.memberships.alphaAdmin.id,
      tags: [],
    });

    await expect(
      createActivity(adminAccess(), {
        customerId: customer.id,
        type: "MEETING",
        title: "Header meeting",
        description: null,
        contactId: null,
        occurredAt: new Date("2026-09-28T10:00:00.000Z"),
        isMeaningful: true,
        operationKey: randomUUID(),
      }),
    ).resolves.toHaveProperty("id");
    await expect(
      createTask(adminAccess(), {
        customerId: customer.id,
        title: "Header task",
        description: null,
        ownerId: fixture.memberships.alphaAdmin.id,
        priority: "MEDIUM",
        dueDate: null,
        dueAt: null,
        operationKey: randomUUID(),
      }),
    ).resolves.toHaveProperty("id");
    await expect(
      saveRisk(adminAccess(), {
        riskId: null,
        customerId: customer.id,
        title: "Header risk",
        description: null,
        type: "OTHER",
        severity: "MEDIUM",
        ownerId: fixture.memberships.alphaAdmin.id,
        targetResolutionDate: null,
        operationKey: randomUUID(),
      }),
    ).resolves.toHaveProperty("id");

    await expect(
      createActivity(betaAccess(), {
        customerId: customer.id,
        type: "CALL",
        title: "Cross tenant",
        description: null,
        contactId: null,
        occurredAt: new Date(),
        isMeaningful: true,
        operationKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "ACTIVITY_NOT_FOUND" });
    await expect(
      createTask(viewerAccess(), {
        customerId: customer.id,
        title: "Viewer task",
        description: null,
        ownerId: fixture.memberships.alphaViewer.id,
        priority: "LOW",
        dueDate: null,
        dueAt: null,
        operationKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "TASK_FORBIDDEN" });

    await archiveCustomer(adminAccess(), customer.id);
    await expect(
      saveRisk(adminAccess(), {
        riskId: null,
        customerId: customer.id,
        title: "Archived risk",
        description: null,
        type: "OTHER",
        severity: "LOW",
        ownerId: fixture.memberships.alphaAdmin.id,
        targetResolutionDate: null,
        operationKey: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "RISK_NOT_FOUND" });
  });

  it("keeps global search scoped to the active workspace", async () => {
    const alpha = await createCustomer(adminAccess(), {
      name: "Scoped Search Alpha",
      website: "https://scoped-alpha.example.test",
      industry: null,
      companySize: null,
      contractValue: null,
      currency: "SAR",
      customerSince: null,
      renewalDate: null,
      lifecycleStageId: fixture.alphaStages[0].id,
      ownerId: fixture.memberships.alphaAdmin.id,
      tags: [],
    });
    const beta = await createCustomer(betaAccess(), {
      name: "Scoped Search Beta",
      website: "https://scoped-beta.example.test",
      industry: null,
      companySize: null,
      contractValue: null,
      currency: "USD",
      customerSince: null,
      renewalDate: null,
      lifecycleStageId: fixture.betaStages[0].id,
      ownerId: fixture.memberships.betaAdmin.id,
      tags: [],
    });

    const alphaResults = await globalSearch(adminAccess(), "Scoped Search");
    expect(alphaResults.map((result) => result.href)).toContain(
      `/customers/${alpha.id}`,
    );
    expect(alphaResults.map((result) => result.href)).not.toContain(
      `/customers/${beta.id}`,
    );
  });
});
