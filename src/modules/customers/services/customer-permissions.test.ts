import { describe, expect, it } from "vitest";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";

import {
  canArchiveCustomer,
  canAssignCustomerOwner,
  canCreateCustomer,
  canEditCustomer,
} from "./customer-permissions";

function access(role: WorkspaceAccessContext["role"]): WorkspaceAccessContext {
  return { userId: "user", workspaceId: "workspace", memberId: "member", role };
}

describe("customer permissions", () => {
  it.each(["ADMIN", "CS_MANAGER"] as const)(
    "allows %s to manage the portfolio",
    (role) => {
      expect(canCreateCustomer(access(role))).toBe(true);
      expect(canEditCustomer(access(role), "another-member")).toBe(true);
      expect(canAssignCustomerOwner(access(role))).toBe(true);
      expect(canArchiveCustomer(access(role))).toBe(true);
    },
  );

  it("limits a CSM to creating self-owned and editing assigned customers", () => {
    const csm = access("CSM");
    expect(canCreateCustomer(csm)).toBe(true);
    expect(canEditCustomer(csm, csm.memberId)).toBe(true);
    expect(canEditCustomer(csm, "another-member")).toBe(false);
    expect(canAssignCustomerOwner(csm)).toBe(false);
    expect(canArchiveCustomer(csm)).toBe(false);
  });

  it("keeps viewers read-only", () => {
    const viewer = access("VIEWER");
    expect(canCreateCustomer(viewer)).toBe(false);
    expect(canEditCustomer(viewer, viewer.memberId)).toBe(false);
    expect(canArchiveCustomer(viewer)).toBe(false);
  });
});
