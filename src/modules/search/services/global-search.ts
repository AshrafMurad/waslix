import "server-only";

import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export async function globalSearch(
  access: WorkspaceAccessContext,
  term: string,
) {
  const [customers, contacts, tasks] = await Promise.all([
    prisma.customer.findMany({
      where: {
        workspaceId: access.workspaceId,
        status: "ACTIVE",
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { website: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 5,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, website: true },
    }),
    prisma.contact.findMany({
      where: {
        workspaceId: access.workspaceId,
        status: "ACTIVE",
        customer: { status: "ACTIVE" },
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 5,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        customerId: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        workspaceId: access.workspaceId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
        title: { contains: term, mode: "insensitive" },
      },
      take: 5,
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      select: {
        id: true,
        title: true,
        customerId: true,
        customer: { select: { name: true } },
      },
    }),
  ]);
  return [
    ...customers.map((customer) => ({
      id: `customer:${customer.id}`,
      type: "customer" as const,
      title: customer.name,
      subtitle: customer.website,
      href: `/customers/${customer.id}`,
    })),
    ...contacts.map((contact) => ({
      id: `contact:${contact.id}`,
      type: "contact" as const,
      title: contact.name,
      subtitle: contact.email ?? contact.customer.name,
      href: `/customers/${contact.customerId}/contacts`,
    })),
    ...tasks.map((task) => ({
      id: `task:${task.id}`,
      type: "task" as const,
      title: task.title,
      subtitle: task.customer?.name ?? null,
      href: task.customerId ? `/customers/${task.customerId}/tasks` : "/tasks",
    })),
  ];
}
