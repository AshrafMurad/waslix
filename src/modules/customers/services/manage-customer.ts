import "server-only";

import { Prisma } from "@prisma/client";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

import type {
  ContactInput,
  CustomerInput,
  UpdateContactInput,
} from "../validation/customer-input";
import { CustomerDomainError } from "./customer-errors";
import {
  canArchiveCustomer,
  canAssignCustomerOwner,
  canCreateCustomer,
  canEditCustomer,
} from "./customer-permissions";

function calendarDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

async function requireEligibleOwner(
  access: WorkspaceAccessContext,
  ownerId: string,
) {
  const owner = await prisma.workspaceMember.findFirst({
    where: {
      id: ownerId,
      workspaceId: access.workspaceId,
      status: "ACTIVE",
      role: { in: ["ADMIN", "CS_MANAGER", "CSM"] },
    },
    select: { id: true },
  });
  if (!owner) throw new CustomerDomainError("CUSTOMER_OWNER_INVALID");
}

async function requireActiveStage(
  access: WorkspaceAccessContext,
  lifecycleStageId: string,
) {
  const stage = await prisma.lifecycleStage.findFirst({
    where: {
      id: lifecycleStageId,
      workspaceId: access.workspaceId,
      isActive: true,
    },
    select: { id: true },
  });
  if (!stage) throw new CustomerDomainError("CUSTOMER_STAGE_INVALID");
}

function customerData(input: CustomerInput) {
  return {
    name: input.name,
    website: input.website,
    industry: input.industry,
    companySize: input.companySize,
    contractValue: input.contractValue,
    currency: input.currency,
    customerSince: calendarDate(input.customerSince),
    renewalDate: calendarDate(input.renewalDate),
    lifecycleStageId: input.lifecycleStageId,
    ownerId: input.ownerId,
  };
}

async function syncTags(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  customerId: string,
  names: string[],
) {
  await transaction.customerTag.deleteMany({
    where: { workspaceId, customerId },
  });
  for (const name of names) {
    const tag = await transaction.tag.upsert({
      where: {
        workspaceId_normalizedName: {
          workspaceId,
          normalizedName: name.toLocaleLowerCase("en-US"),
        },
      },
      update: { name },
      create: {
        workspaceId,
        name,
        normalizedName: name.toLocaleLowerCase("en-US"),
      },
      select: { id: true },
    });
    await transaction.customerTag.create({
      data: { workspaceId, customerId, tagId: tag.id },
    });
  }
}

export async function createCustomer(
  access: WorkspaceAccessContext,
  input: CustomerInput,
) {
  if (!canCreateCustomer(access)) {
    throw new CustomerDomainError("CUSTOMER_FORBIDDEN");
  }
  const ownerId = access.role === "CSM" ? access.memberId : input.ownerId;
  await Promise.all([
    requireEligibleOwner(access, ownerId),
    requireActiveStage(access, input.lifecycleStageId),
  ]);

  return prisma.$transaction(async (transaction) => {
    const customer = await transaction.customer.create({
      data: {
        ...customerData({ ...input, ownerId }),
        workspaceId: access.workspaceId,
      },
      select: { id: true },
    });
    await syncTags(transaction, access.workspaceId, customer.id, input.tags);
    return customer;
  });
}

export async function updateCustomer(
  access: WorkspaceAccessContext,
  customerId: string,
  input: CustomerInput,
) {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: { ownerId: true, status: true },
  });
  if (!existing || !canEditCustomer(access, existing.ownerId)) {
    throw new CustomerDomainError("CUSTOMER_NOT_FOUND");
  }
  if (existing.status === "ARCHIVED") {
    throw new CustomerDomainError("CUSTOMER_ARCHIVED");
  }
  if (input.ownerId !== existing.ownerId && !canAssignCustomerOwner(access)) {
    throw new CustomerDomainError("CUSTOMER_FORBIDDEN");
  }
  await Promise.all([
    requireEligibleOwner(access, input.ownerId),
    requireActiveStage(access, input.lifecycleStageId),
  ]);

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.customer.updateMany({
      where: {
        id: customerId,
        workspaceId: access.workspaceId,
        status: "ACTIVE",
      },
      data: customerData(input),
    });
    if (updated.count !== 1) {
      throw new CustomerDomainError("CUSTOMER_ARCHIVED");
    }
    if (input.ownerId !== existing.ownerId) {
      await transaction.successGoal.updateMany({
        where: {
          workspaceId: access.workspaceId,
          customerId,
          ownerId: existing.ownerId,
          status: { in: ["NOT_STARTED", "IN_PROGRESS", "AT_RISK"] },
        },
        data: { ownerId: input.ownerId },
      });
      await transaction.risk.updateMany({
        where: {
          workspaceId: access.workspaceId,
          customerId,
          ownerId: existing.ownerId,
          status: { in: ["OPEN", "MONITORING"] },
        },
        data: { ownerId: input.ownerId },
      });
    }
    await syncTags(transaction, access.workspaceId, customerId, input.tags);
    return { id: customerId };
  });
}

export async function archiveCustomer(
  access: WorkspaceAccessContext,
  customerId: string,
) {
  if (!canArchiveCustomer(access)) {
    throw new CustomerDomainError("CUSTOMER_NOT_FOUND");
  }
  await prisma.$transaction(async (transaction) => {
    const now = new Date();
    const result = await transaction.customer.updateMany({
      where: {
        id: customerId,
        workspaceId: access.workspaceId,
        status: "ACTIVE",
      },
      data: { status: "ARCHIVED", archivedAt: now },
    });
    if (result.count !== 1) throw new CustomerDomainError("CUSTOMER_NOT_FOUND");
    await transaction.signal.updateMany({
      where: { workspaceId: access.workspaceId, customerId, status: "ACTIVE" },
      data: { status: "EXPIRED", resolvedAt: now, lastEvaluatedAt: now },
    });
    await transaction.attentionItem.updateMany({
      where: {
        workspaceId: access.workspaceId,
        customerId,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
      data: {
        status: "DISMISSED",
        dismissedReason: "CUSTOMER_ARCHIVED",
        resolvedAt: now,
      },
    });
  });
}

export async function createContact(
  access: WorkspaceAccessContext,
  input: ContactInput,
) {
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, workspaceId: access.workspaceId },
    select: { ownerId: true, status: true },
  });
  if (!customer || !canEditCustomer(access, customer.ownerId)) {
    throw new CustomerDomainError("CUSTOMER_NOT_FOUND");
  }
  if (customer.status === "ARCHIVED") {
    throw new CustomerDomainError("CUSTOMER_ARCHIVED");
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      if (input.isPrimary) {
        await transaction.contact.updateMany({
          where: {
            workspaceId: access.workspaceId,
            customerId: input.customerId,
            status: "ACTIVE",
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }
      return transaction.contact.create({
        data: { ...input, workspaceId: access.workspaceId },
        select: { id: true },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CustomerDomainError("CONTACT_PRIMARY_CONFLICT");
    }
    throw error;
  }
}

export async function setPrimaryContact(
  access: WorkspaceAccessContext,
  customerId: string,
  contactId: string,
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, workspaceId: access.workspaceId },
    select: { ownerId: true, status: true },
  });
  if (!customer || !canEditCustomer(access, customer.ownerId)) {
    throw new CustomerDomainError("CUSTOMER_NOT_FOUND");
  }
  if (customer.status === "ARCHIVED") {
    throw new CustomerDomainError("CUSTOMER_ARCHIVED");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const contact = await transaction.contact.findFirst({
        where: {
          id: contactId,
          customerId,
          workspaceId: access.workspaceId,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (!contact) throw new CustomerDomainError("CUSTOMER_NOT_FOUND");
      await transaction.contact.updateMany({
        where: {
          workspaceId: access.workspaceId,
          customerId,
          status: "ACTIVE",
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
      await transaction.contact.update({
        where: { id: contactId },
        data: { isPrimary: true },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CustomerDomainError("CONTACT_PRIMARY_CONFLICT");
    }
    throw error;
  }
}

export async function updateContact(
  access: WorkspaceAccessContext,
  input: UpdateContactInput,
) {
  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      customerId: input.customerId,
      workspaceId: access.workspaceId,
    },
    select: { customer: { select: { ownerId: true, status: true } } },
  });
  if (!contact || !canEditCustomer(access, contact.customer.ownerId)) {
    throw new CustomerDomainError("CUSTOMER_NOT_FOUND");
  }
  if (contact.customer.status === "ARCHIVED") {
    throw new CustomerDomainError("CUSTOMER_ARCHIVED");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      if (input.isPrimary && input.status === "ACTIVE") {
        await transaction.contact.updateMany({
          where: {
            workspaceId: access.workspaceId,
            customerId: input.customerId,
            status: "ACTIVE",
            isPrimary: true,
            id: { not: input.contactId },
          },
          data: { isPrimary: false },
        });
      }
      const updated = await transaction.contact.updateMany({
        where: {
          id: input.contactId,
          customerId: input.customerId,
          workspaceId: access.workspaceId,
        },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          jobTitle: input.jobTitle,
          accountRole: input.accountRole,
          status: input.status,
          isPrimary: input.status === "ACTIVE" && input.isPrimary,
        },
      });
      if (updated.count !== 1) {
        throw new CustomerDomainError("CUSTOMER_NOT_FOUND");
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CustomerDomainError("CONTACT_PRIMARY_CONFLICT");
    }
    throw error;
  }
}
