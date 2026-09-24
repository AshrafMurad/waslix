"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireWorkspaceAccess } from "@/lib/auth/access-context";

import { CustomerDomainError } from "../services/customer-errors";
import {
  archiveCustomer,
  createContact,
  createCustomer,
  setPrimaryContact,
  updateContact,
  updateCustomer,
} from "../services/manage-customer";
import {
  contactInputSchema,
  customerIdSchema,
  customerInputSchema,
  updateContactInputSchema,
} from "../validation/customer-input";

export type CustomerActionState = {
  status: "idle" | "success" | "error";
  code?: string;
  fieldErrors?: Record<string, string>;
};

function validationState(error: z.ZodError): CustomerActionState {
  return {
    status: "error",
    code: "VALIDATION_ERROR",
    fieldErrors: Object.fromEntries(
      error.issues.map((issue) => [
        String(issue.path[0] ?? "form"),
        issue.message,
      ]),
    ),
  };
}

function domainState(error: unknown): CustomerActionState {
  return {
    status: "error",
    code:
      error instanceof CustomerDomainError
        ? error.code
        : "CUSTOMER_SAVE_FAILED",
  };
}

function localeFrom(formData: FormData) {
  const locale = formData.get("locale");
  return typeof locale === "string" && isLocale(locale) ? locale : "en";
}

export async function createCustomerAction(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = customerInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    const customer = await createCustomer(access, parsed.data);
    const locale = localeFrom(formData);
    revalidatePath(`/${locale}/customers`);
    redirect(`/${locale}/customers/${customer.id}`);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"))
      throw error;
    return domainState(error);
  }
}

export async function updateCustomerAction(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const id = customerIdSchema.safeParse(Object.fromEntries(formData));
  const input = customerInputSchema.safeParse(Object.fromEntries(formData));
  if (!id.success) return validationState(id.error);
  if (!input.success) return validationState(input.error);
  const access = await requireWorkspaceAccess();
  try {
    await updateCustomer(access, id.data.customerId, input.data);
    revalidatePath(`/${localeFrom(formData)}/customers/${id.data.customerId}`);
    return { status: "success" };
  } catch (error) {
    return domainState(error);
  }
}

export async function archiveCustomerAction(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const id = customerIdSchema.safeParse(Object.fromEntries(formData));
  if (!id.success) return validationState(id.error);
  const access = await requireWorkspaceAccess();
  try {
    await archiveCustomer(access, id.data.customerId);
    revalidatePath(`/${localeFrom(formData)}/customers`);
    return { status: "success" };
  } catch (error) {
    return domainState(error);
  }
}

export async function createContactAction(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = contactInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    await createContact(access, parsed.data);
    revalidatePath(
      `/${localeFrom(formData)}/customers/${parsed.data.customerId}`,
    );
    return { status: "success" };
  } catch (error) {
    return domainState(error);
  }
}

export async function setPrimaryContactAction(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = z
    .object({ customerId: z.uuid(), contactId: z.uuid() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    await setPrimaryContact(
      access,
      parsed.data.customerId,
      parsed.data.contactId,
    );
    revalidatePath(
      `/${localeFrom(formData)}/customers/${parsed.data.customerId}`,
    );
    return { status: "success" };
  } catch (error) {
    return domainState(error);
  }
}

export async function updateContactAction(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = updateContactInputSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return validationState(parsed.error);
  const access = await requireWorkspaceAccess();
  try {
    await updateContact(access, parsed.data);
    revalidatePath(
      `/${localeFrom(formData)}/customers/${parsed.data.customerId}`,
    );
    return { status: "success" };
  } catch (error) {
    return domainState(error);
  }
}
