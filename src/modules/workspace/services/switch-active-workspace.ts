import "server-only";

import { auth } from "@/lib/auth/auth";
import {
  AuthenticationRequiredError,
  WorkspaceAccessDeniedError,
} from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function switchActiveWorkspace(
  workspaceId: string,
  requestHeaders: Headers,
) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    throw new AuthenticationRequiredError();
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
    select: { status: true },
  });

  if (membership?.status !== "ACTIVE") {
    throw new WorkspaceAccessDeniedError();
  }

  await auth.api.setActiveOrganization({
    headers: requestHeaders,
    body: { organizationId: workspaceId },
  });
}
