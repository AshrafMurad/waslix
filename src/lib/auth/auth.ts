import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { prisma } from "@/lib/db/prisma";
import {
  organizationAccess,
  organizationRoles,
} from "@/lib/permissions/roles";

export const auth = betterAuth({
  appName: "Waslix",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      preferredLocale: {
        type: ["EN", "AR"],
        required: true,
        defaultValue: "EN",
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const membership = await prisma.workspaceMember.findFirst({
            where: {
              userId: session.userId,
              status: "ACTIVE",
            },
            orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
            select: { workspaceId: true },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: membership?.workspaceId ?? null,
            },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      ac: organizationAccess,
      roles: organizationRoles,
      allowUserToCreateOrganization: false,
      disableOrganizationDeletion: true,
      requireEmailVerificationOnInvitation: true,
      schema: {
        session: {
          fields: {
            activeOrganizationId: "activeWorkspaceId",
          },
        },
        organization: {
          modelName: "workspace",
          additionalFields: {
            timezone: {
              type: "string",
              required: true,
              defaultValue: "UTC",
              input: false,
            },
            defaultCurrency: {
              type: "string",
              required: true,
              defaultValue: "USD",
              input: false,
            },
            updatedAt: {
              type: "date",
              required: true,
              input: false,
            },
          },
        },
        member: {
          modelName: "workspaceMember",
          fields: {
            organizationId: "workspaceId",
            createdAt: "joinedAt",
          },
          additionalFields: {
            status: {
              type: ["ACTIVE", "INACTIVE"],
              required: true,
              defaultValue: "ACTIVE",
              input: false,
            },
          },
        },
        invitation: {
          fields: {
            organizationId: "workspaceId",
          },
        },
      },
    }),
    nextCookies(),
  ],
});
