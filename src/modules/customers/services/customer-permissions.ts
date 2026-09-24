import type { WorkspaceAccessContext } from "@/lib/auth/access-context";

export function canCreateCustomer(access: WorkspaceAccessContext) {
  return access.role !== "VIEWER";
}

export function canEditCustomer(
  access: WorkspaceAccessContext,
  ownerId: string,
) {
  return (
    access.role === "ADMIN" ||
    access.role === "CS_MANAGER" ||
    (access.role === "CSM" && ownerId === access.memberId)
  );
}

export function canAssignCustomerOwner(access: WorkspaceAccessContext) {
  return access.role === "ADMIN" || access.role === "CS_MANAGER";
}

export function canArchiveCustomer(access: WorkspaceAccessContext) {
  return access.role === "ADMIN" || access.role === "CS_MANAGER";
}
