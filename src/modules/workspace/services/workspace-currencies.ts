import "server-only";

import type { Prisma } from "@prisma/client";

import {
  WorkspaceAccessDeniedError,
  type WorkspaceAccessContext,
} from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import { hasWorkspaceCapability } from "@/lib/permissions/roles";

export type WorkspaceCurrencyInput = {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
  isDefault: boolean;
};

export async function requireActiveWorkspaceCurrency(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  code: string,
) {
  const currency = await transaction.workspaceCurrency.findFirst({
    where: { workspaceId, code, isActive: true },
    select: { code: true },
  });
  if (currency) return;

  const workspace = await transaction.workspace.findFirst({
    where: { id: workspaceId, defaultCurrency: code },
    select: { id: true },
  });
  if (!workspace) throw new WorkspaceAccessDeniedError();

  await transaction.workspaceCurrency.upsert({
    where: { workspaceId_code: { workspaceId, code } },
    create: {
      workspaceId,
      code,
      name: code,
      symbol: code,
      decimalPlaces: 2,
      isActive: true,
      isDefault: true,
    },
    update: { isActive: true },
    select: { id: true },
  });
}

export async function addWorkspaceCurrency(
  access: WorkspaceAccessContext,
  input: WorkspaceCurrencyInput,
) {
  if (!hasWorkspaceCapability(access.role, "manageWorkspaceMembership")) {
    throw new WorkspaceAccessDeniedError();
  }

  const code = input.code.trim().toUpperCase();
  return prisma.$transaction(async (transaction) => {
    const currencyCount = await transaction.workspaceCurrency.count({
      where: { workspaceId: access.workspaceId },
    });
    const shouldBeDefault = input.isDefault || currencyCount === 0;

    if (shouldBeDefault) {
      await transaction.workspaceCurrency.updateMany({
        where: { workspaceId: access.workspaceId, isDefault: true },
        data: { isDefault: false },
      });
      await transaction.workspace.update({
        where: { id: access.workspaceId },
        data: { defaultCurrency: code },
      });
    }

    return transaction.workspaceCurrency.create({
      data: {
        workspaceId: access.workspaceId,
        code,
        name: input.name.trim(),
        symbol: input.symbol.trim(),
        decimalPlaces: input.decimalPlaces,
        isActive: input.isActive || shouldBeDefault,
        isDefault: shouldBeDefault,
      },
      select: { id: true },
    });
  });
}

export async function updateWorkspaceCurrency(
  access: WorkspaceAccessContext,
  input: { currencyId: string; isActive: boolean; isDefault: boolean },
) {
  if (!hasWorkspaceCapability(access.role, "manageWorkspaceMembership")) {
    throw new WorkspaceAccessDeniedError();
  }

  return prisma.$transaction(async (transaction) => {
    const currency = await transaction.workspaceCurrency.findFirst({
      where: { id: input.currencyId, workspaceId: access.workspaceId },
      select: { id: true, code: true, isDefault: true },
    });
    if (!currency) throw new WorkspaceAccessDeniedError();

    if (!input.isActive && currency.isDefault) {
      throw new WorkspaceAccessDeniedError();
    }

    if (!input.isActive) {
      const [customerCount, renewalCount] = await Promise.all([
        transaction.customer.count({
          where: {
            workspaceId: access.workspaceId,
            currency: currency.code,
            status: "ACTIVE",
          },
        }),
        transaction.renewal.count({
          where: {
            workspaceId: access.workspaceId,
            currency: currency.code,
            stage: { notIn: ["RENEWED", "CHURNED"] },
          },
        }),
      ]);
      if (customerCount > 0 || renewalCount > 0) {
        throw new WorkspaceAccessDeniedError();
      }
    }

    if (input.isDefault) {
      await transaction.workspaceCurrency.updateMany({
        where: { workspaceId: access.workspaceId, isDefault: true },
        data: { isDefault: false },
      });
      await transaction.workspace.update({
        where: { id: access.workspaceId },
        data: { defaultCurrency: currency.code },
      });
    }

    return transaction.workspaceCurrency.update({
      where: { id: currency.id },
      data: {
        isActive: input.isActive || input.isDefault,
        isDefault: input.isDefault,
      },
      select: { id: true },
    });
  });
}
