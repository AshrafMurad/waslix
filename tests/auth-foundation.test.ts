import { describe, expect, it } from "vitest";

import { toAppLocale, toPreferredLocale } from "@/i18n/preferred-locale";
import {
  hasWorkspaceCapability,
  isWorkspaceRole,
  workspaceRoles,
} from "@/lib/permissions/roles";
import {
  AuthenticationRequiredError,
  resolveWorkspaceAccess,
  WorkspaceAccessDeniedError,
} from "@/lib/auth/resolve-workspace-access";

describe("preferred locale mapping", () => {
  it.each([
    ["EN", "en"],
    ["AR", "ar"],
  ] as const)("maps %s centrally to %s and back", (preference, locale) => {
    expect(toAppLocale(preference)).toBe(locale);
    expect(toPreferredLocale(locale)).toBe(preference);
  });
});

describe("fixed workspace roles", () => {
  it("resolves exactly the four documented roles", () => {
    expect(workspaceRoles).toEqual(["ADMIN", "CS_MANAGER", "CSM", "VIEWER"]);
    expect(workspaceRoles.every(isWorkspaceRole)).toBe(true);
    expect(hasWorkspaceCapability("ADMIN", "manageWorkspaceMembership")).toBe(
      true,
    );
    expect(hasWorkspaceCapability("CS_MANAGER", "manageWorkspaceMembership")).toBe(
      false,
    );
    expect(hasWorkspaceCapability("CSM", "manageWorkspaceMembership")).toBe(false);
    expect(hasWorkspaceCapability("VIEWER", "manageWorkspaceMembership")).toBe(
      false,
    );
  });
});

describe("workspace access resolution", () => {
  it("requires authentication and a server-verified active membership", async () => {
    await expect(resolveWorkspaceAccess(null, async () => null)).rejects.toBeInstanceOf(
      AuthenticationRequiredError,
    );

    await expect(
      resolveWorkspaceAccess(
        {
          user: { id: "user-a" },
          session: { activeOrganizationId: "workspace-a" },
        },
        async () => ({
          id: "member-a",
          workspaceId: "workspace-a",
          role: "CSM",
          status: "INACTIVE",
        }),
      ),
    ).rejects.toBeInstanceOf(WorkspaceAccessDeniedError);
  });

  it("uses the verified membership role instead of client input", async () => {
    const access = await resolveWorkspaceAccess(
      {
        user: { id: "user-a" },
        session: { activeOrganizationId: "workspace-a" },
      },
      async ({ userId, workspaceId }) => ({
        id: "member-a",
        workspaceId,
        role: userId === "user-a" ? "VIEWER" : "ADMIN",
        status: "ACTIVE",
      }),
    );

    expect(access).toEqual({
      userId: "user-a",
      workspaceId: "workspace-a",
      memberId: "member-a",
      role: "VIEWER",
    });
  });
});
