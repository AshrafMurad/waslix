import { describe, expect, it } from "vitest";

import { hasWorkspaceCapability, type WorkspaceRole } from "./roles";

describe("workspace role capabilities", () => {
  it.each(["ADMIN", "CS_MANAGER"] as const)(
    "allows %s to transfer ownership",
    (role) => {
      expect(hasWorkspaceCapability(role, "transferWorkspaceOwnership")).toBe(
        true,
      );
    },
  );

  it.each(["CSM", "VIEWER"] as const)(
    "denies %s ownership transfer and settings management",
    (role) => {
      expect(hasWorkspaceCapability(role, "transferWorkspaceOwnership")).toBe(
        false,
      );
      expect(hasWorkspaceCapability(role, "manageWorkspaceMembership")).toBe(
        false,
      );
    },
  );

  it("keeps settings and membership management admin-only", () => {
    const roles: WorkspaceRole[] = ["ADMIN", "CS_MANAGER", "CSM", "VIEWER"];

    expect(
      roles.filter((role) =>
        hasWorkspaceCapability(role, "manageWorkspaceMembership"),
      ),
    ).toEqual(["ADMIN"]);
  });
});
