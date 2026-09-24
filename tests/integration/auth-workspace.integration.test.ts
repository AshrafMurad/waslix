import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { auth } from "@/lib/auth/auth";
import {
  requireWorkspaceAccess,
  WorkspaceAccessDeniedError,
} from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";
import {
  getWorkspaceMemberById,
  getWorkspaceMembers,
} from "@/modules/workspace/queries/get-workspace-members";
import { changeMembershipRole } from "@/modules/workspace/services/change-membership";
import { switchActiveWorkspace } from "@/modules/workspace/services/switch-active-workspace";
import { updatePreferredLocale } from "@/modules/workspace/services/update-preferred-locale";
import { seedTwoWorkspaceFixture } from "../fixtures/two-workspaces";

function cookieHeader(response: Response) {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("Authentication response did not set a session cookie");
  }

  return setCookie.split(";", 1)[0];
}

async function authRequest(
  path: string,
  body?: Record<string, unknown>,
  cookie?: string,
) {
  return auth.handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        ...(body ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}

describe("Better Auth workspace foundation", () => {
  let fixture: Awaited<ReturnType<typeof seedTwoWorkspaceFixture>>;
  const fixturePassword = "FixturePassword123!";

  beforeAll(async () => {
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
    fixture = await seedTwoWorkspaceFixture(prisma, fixturePassword);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("signs in a seeded local fixture account", async () => {
    const response = await authRequest("/sign-in/email", {
      email: fixture.users.manager.email,
      password: fixturePassword,
    });
    expect(response.status).toBe(200);

    const access = await requireWorkspaceAccess(
      new Headers({ cookie: cookieHeader(response) }),
    );
    expect(access).toMatchObject({
      workspaceId: fixture.workspaceA.id,
      memberId: fixture.memberships.alphaManager.id,
      role: "CS_MANAGER",
    });
  });

  it("signs in, switches only to an active membership, and signs out", async () => {
    const email = `auth-${randomUUID()}@fixture.waslix.test`;
    const password = `Test-${randomUUID()}-aA1!`;
    const signUpResponse = await authRequest("/sign-up/email", {
      name: "Authentication Test",
      email,
      password,
    });
    expect(signUpResponse.status).toBe(200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await prisma.workspaceMember.createMany({
      data: [
        {
          workspaceId: fixture.workspaceA.id,
          userId: user.id,
          role: "CSM",
          joinedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          workspaceId: fixture.workspaceB.id,
          userId: user.id,
          role: "VIEWER",
          joinedAt: new Date("2026-02-01T00:00:00.000Z"),
        },
      ],
    });

    const initialCookie = cookieHeader(signUpResponse);
    const initialSignOut = await authRequest("/sign-out", {}, initialCookie);
    expect(initialSignOut.status).toBe(200);

    const signInResponse = await authRequest("/sign-in/email", {
      email,
      password,
    });
    expect(signInResponse.status).toBe(200);
    const sessionCookie = cookieHeader(signInResponse);
    const requestHeaders = new Headers({ cookie: sessionCookie });

    const initialAccess = await requireWorkspaceAccess(requestHeaders);
    expect(initialAccess.workspaceId).toBe(fixture.workspaceA.id);

    await switchActiveWorkspace(fixture.workspaceB.id, requestHeaders);
    const switchedAccess = await requireWorkspaceAccess(requestHeaders);
    expect(switchedAccess.workspaceId).toBe(fixture.workspaceB.id);
    expect(switchedAccess.role).toBe("VIEWER");

    await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId: fixture.workspaceB.id,
          userId: user.id,
        },
      },
      data: { status: "INACTIVE" },
    });
    await expect(requireWorkspaceAccess(requestHeaders)).rejects.toBeInstanceOf(
      WorkspaceAccessDeniedError,
    );

    const signOutResponse = await authRequest("/sign-out", {}, sessionCookie);
    expect(signOutResponse.status).toBe(200);
    const sessionResponse = await authRequest(
      "/get-session",
      undefined,
      sessionCookie,
    );
    expect(await sessionResponse.json()).toBeNull();
  });

  it("does not disclose or mutate records from another workspace", async () => {
    const alphaAccess = {
      userId: fixture.users.shared.id,
      workspaceId: fixture.workspaceA.id,
      memberId: fixture.memberships.alphaAdmin.id,
      role: "ADMIN" as const,
    };

    const alphaRoles = (await getWorkspaceMembers(alphaAccess)).map(
      (member) => member.role,
    );
    expect(alphaRoles).toEqual(
      expect.arrayContaining(["ADMIN", "CS_MANAGER", "CSM", "VIEWER"]),
    );

    await expect(
      getWorkspaceMemberById(alphaAccess, fixture.memberships.betaAdmin.id),
    ).resolves.toBeNull();

    await expect(
      changeMembershipRole(
        alphaAccess,
        fixture.memberships.betaAdmin.id,
        "VIEWER",
      ),
    ).rejects.toBeInstanceOf(WorkspaceAccessDeniedError);

    const betaAdmin = await prisma.workspaceMember.findUniqueOrThrow({
      where: { id: fixture.memberships.betaAdmin.id },
    });
    expect(betaAdmin.role).toBe("ADMIN");
  });

  it("persists both preferred locales through the central mapping", async () => {
    const access = {
      userId: fixture.users.shared.id,
      workspaceId: fixture.workspaceA.id,
      memberId: fixture.memberships.alphaAdmin.id,
      role: "ADMIN" as const,
    };

    await expect(updatePreferredLocale(access, "ar")).resolves.toMatchObject({
      preferredLocale: "AR",
    });
    await expect(updatePreferredLocale(access, "en")).resolves.toMatchObject({
      preferredLocale: "EN",
    });
  });
});
