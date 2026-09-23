"use client";

import { createAuthClient } from "better-auth/react";
import {
  inferOrgAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";

import type { auth } from "./auth";
import {
  organizationAccess,
  organizationRoles,
} from "../permissions/roles";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac: organizationAccess,
      roles: organizationRoles,
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
  ],
});
