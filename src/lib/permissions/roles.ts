import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

export const workspaceRoles = [
  "ADMIN",
  "CS_MANAGER",
  "CSM",
  "VIEWER",
] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];

export const organizationAccess = createAccessControl(defaultStatements);

const noOrganizationMutations = {
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: [],
} as const;

export const organizationRoles = {
  ADMIN: organizationAccess.newRole({
    organization: ["update"],
    member: ["update"],
    invitation: ["create", "cancel"],
    team: [],
    ac: [],
  }),
  CS_MANAGER: organizationAccess.newRole(noOrganizationMutations),
  CSM: organizationAccess.newRole(noOrganizationMutations),
  VIEWER: organizationAccess.newRole(noOrganizationMutations),
};

export function isWorkspaceRole(role: string): role is WorkspaceRole {
  return workspaceRoles.some((workspaceRole) => workspaceRole === role);
}

export type WorkspaceCapability =
  | "readWorkspace"
  | "manageWorkspaceMembership";

export function hasWorkspaceCapability(
  role: WorkspaceRole,
  capability: WorkspaceCapability,
) {
  if (capability === "readWorkspace") {
    return true;
  }

  return role === "ADMIN";
}
