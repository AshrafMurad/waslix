import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getCustomerOverview } from "@/modules/customers/queries/get-customer-overview";
import { getCustomerPortfolio } from "@/modules/customers/queries/get-customer-portfolio";
import { CustomerDomainError } from "@/modules/customers/services/customer-errors";
import {
  archiveCustomer,
  createContact,
  createCustomer,
  updateContact,
  updateCustomer,
} from "@/modules/customers/services/manage-customer";
import { seedTwoWorkspaceFixture } from "../fixtures/two-workspaces";

describe("customer domain", () => {
  let fixture: Awaited<ReturnType<typeof seedTwoWorkspaceFixture>>;

  beforeAll(async () => {
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
    fixture = await seedTwoWorkspaceFixture(prisma);
  });

  afterAll(async () => prisma.$disconnect());

  it("persists a workspace-scoped customer and excludes it after archive", async () => {
    const access = {
      userId: fixture.users.shared.id,
      workspaceId: fixture.workspaceA.id,
      memberId: fixture.memberships.alphaAdmin.id,
      role: "ADMIN" as const,
    };
    const customer = await createCustomer(access, {
      name: "M2 Customer",
      website: "https://example.test",
      industry: "Software",
      companySize: 120,
      contractValue: "42000.00",
      currency: "USD",
      customerSince: "2026-01-01",
      renewalDate: "2027-01-01",
      lifecycleStageId: fixture.alphaStages[0].id,
      ownerId: fixture.memberships.alphaCsm.id,
      tags: ["Strategic"],
    });

    await expect(
      getCustomerOverview(access, customer.id),
    ).resolves.toMatchObject({
      name: "M2 Customer",
      owner: { id: fixture.memberships.alphaCsm.id },
      health: null,
    });
    expect(
      (await getCustomerPortfolio(access, {})).customers.map((item) => item.id),
    ).toContain(customer.id);

    await archiveCustomer(access, customer.id);
    expect(
      (await getCustomerPortfolio(access, {})).customers.map((item) => item.id),
    ).not.toContain(customer.id);
    await expect(
      updateCustomer(access, customer.id, {
        name: "Changed",
        website: null,
        industry: null,
        companySize: null,
        contractValue: null,
        currency: "USD",
        customerSince: null,
        renewalDate: null,
        lifecycleStageId: fixture.alphaStages[0].id,
        ownerId: fixture.memberships.alphaCsm.id,
        tags: [],
      }),
    ).rejects.toMatchObject({ code: "CUSTOMER_ARCHIVED" });
  });

  it("enforces owner permissions and does not disclose cross-workspace records", async () => {
    const manager = {
      userId: fixture.users.manager.id,
      workspaceId: fixture.workspaceA.id,
      memberId: fixture.memberships.alphaManager.id,
      role: "CS_MANAGER" as const,
    };
    const csm = {
      userId: fixture.users.csm.id,
      workspaceId: fixture.workspaceA.id,
      memberId: fixture.memberships.alphaCsm.id,
      role: "CSM" as const,
    };
    const beta = {
      userId: fixture.users.tenantBAdmin.id,
      workspaceId: fixture.workspaceB.id,
      memberId: fixture.memberships.betaAdmin.id,
      role: "ADMIN" as const,
    };
    const customer = await createCustomer(manager, {
      name: "Manager Account",
      website: null,
      industry: null,
      companySize: null,
      contractValue: null,
      currency: "SAR",
      customerSince: null,
      renewalDate: null,
      lifecycleStageId: fixture.alphaStages[0].id,
      ownerId: fixture.memberships.alphaManager.id,
      tags: [],
    });

    await expect(getCustomerOverview(beta, customer.id)).resolves.toBeNull();
    await expect(
      createContact(csm, {
        customerId: customer.id,
        name: "Blocked Contact",
        email: null,
        phone: null,
        jobTitle: null,
        accountRole: "OTHER",
        isPrimary: false,
      }),
    ).rejects.toBeInstanceOf(CustomerDomainError);
  });

  it("keeps one active primary contact under concurrent writes", async () => {
    const access = {
      userId: fixture.users.shared.id,
      workspaceId: fixture.workspaceA.id,
      memberId: fixture.memberships.alphaAdmin.id,
      role: "ADMIN" as const,
    };
    const customer = await createCustomer(access, {
      name: "Contact Concurrency",
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
    await Promise.allSettled(
      ["One", "Two"].map((name) =>
        createContact(access, {
          customerId: customer.id,
          name,
          email: null,
          phone: null,
          jobTitle: null,
          accountRole: "CHAMPION",
          isPrimary: true,
        }),
      ),
    );
    await expect(
      prisma.contact.count({
        where: {
          workspaceId: access.workspaceId,
          customerId: customer.id,
          status: "ACTIVE",
          isPrimary: true,
        },
      }),
    ).resolves.toBe(1);
    const primary = await prisma.contact.findFirstOrThrow({
      where: { customerId: customer.id, isPrimary: true },
    });
    await updateContact(access, {
      customerId: customer.id,
      contactId: primary.id,
      name: primary.name,
      email: primary.email,
      phone: primary.phone,
      jobTitle: primary.jobTitle,
      accountRole: primary.accountRole,
      isPrimary: true,
      status: "INACTIVE",
    });
    await expect(
      prisma.contact.findUniqueOrThrow({ where: { id: primary.id } }),
    ).resolves.toMatchObject({ status: "INACTIVE", isPrimary: false });
  });
});
