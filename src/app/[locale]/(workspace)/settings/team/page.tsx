import { randomUUID } from "node:crypto";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isLocale } from "@/i18n/config";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import {
  hasWorkspaceCapability,
  workspaceRoles,
} from "@/lib/permissions/roles";
import {
  changeMemberRoleAction,
  changeMemberStatusAction,
  transferOwnershipAction,
} from "@/modules/workspace/actions/team-settings-actions";
import { getWorkspaceMembers } from "@/modules/workspace/queries/get-workspace-members";
import {
  getOwnershipTransferPreview,
  totalPreviewCount,
} from "@/modules/workspace/services/ownership-transfer";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const access = await requireProtectedPage(locale);
  if (!hasWorkspaceCapability(access.role, "transferWorkspaceOwnership")) {
    notFound();
  }

  const raw = await searchParams;
  const fromMemberId = first(raw.fromMemberId);
  const [members, t] = await Promise.all([
    getWorkspaceMembers(access),
    getTranslations({ locale, namespace: "workspace" }),
  ]);
  const preview = fromMemberId
    ? await getOwnershipTransferPreview(access, fromMemberId)
    : null;
  const canManageMembers = hasWorkspaceCapability(
    access.role,
    "manageWorkspaceMembership",
  );
  const eligibleTargets = members.filter(
    (member) =>
      member.status === "ACTIVE" &&
      ["ADMIN", "CS_MANAGER", "CSM"].includes(member.role),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-brand-accent text-xs font-medium tracking-wide uppercase">
          {t("team.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("team.title")}
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          {t("team.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("team.transfer.title")}</CardTitle>
          <CardDescription>{t("team.transfer.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            method="get"
          >
            <label className="space-y-2 text-sm font-medium">
              <span>{t("team.transfer.from")}</span>
              <select
                name="fromMemberId"
                defaultValue={fromMemberId ?? ""}
                className="border-input bg-background min-w-64 rounded-md border px-3 py-2"
                required
              >
                <option value="">{t("team.transfer.chooseMember")}</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user.name} ({member.user.email})
                  </option>
                ))}
              </select>
            </label>
            <button className="border-input hover:bg-accent rounded-md border px-4 py-2 text-sm font-medium">
              {t("team.transfer.preview")}
            </button>
          </form>

          {preview && fromMemberId ? (
            <div className="bg-muted/40 space-y-4 rounded-lg border p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(preview).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-background rounded-md border p-3"
                  >
                    <p className="text-muted-foreground text-xs">
                      {t(`team.work.${key}`)}
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <form
                action={transferOwnershipAction}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="fromMemberId" value={fromMemberId} />
                <input type="hidden" name="operationKey" value={randomUUID()} />
                <label className="space-y-2 text-sm font-medium">
                  <span>{t("team.transfer.to")}</span>
                  <select
                    name="toMemberId"
                    className="border-input bg-background min-w-64 rounded-md border px-3 py-2"
                    required
                  >
                    <option value="">{t("team.transfer.chooseTarget")}</option>
                    {eligibleTargets
                      .filter((member) => member.id !== fromMemberId)
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.user.name} ({member.user.email})
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  disabled={totalPreviewCount(preview) === 0}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {t("team.transfer.apply")}
                </button>
              </form>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("team.members.title")}</CardTitle>
          <CardDescription>{t("team.members.description")}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[72rem] text-sm">
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="py-2 text-start">{t("team.members.member")}</th>
                <th className="py-2 text-start">{t("team.members.role")}</th>
                <th className="py-2 text-start">{t("team.members.status")}</th>
                <th className="py-2 text-start">
                  {t("team.members.ownership")}
                </th>
                {canManageMembers ? (
                  <th className="py-2 text-start">
                    {t("team.members.actions")}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b align-top last:border-0"
                >
                  <td className="py-3">
                    <p className="font-medium" dir="auto">
                      {member.user.name}
                    </p>
                    <p className="text-muted-foreground" dir="auto">
                      {member.user.email}
                    </p>
                  </td>
                  <td className="py-3">{t(`roles.${member.role}`)}</td>
                  <td className="py-3">{t(`status.${member.status}`)}</td>
                  <td className="py-3">
                    {t("team.members.ownershipSummary", {
                      customers: member._count.customers,
                      tasks: member._count.ownedTasks,
                      risks: member._count.ownedRisks,
                      goals: member._count.ownedGoals,
                    })}
                  </td>
                  {canManageMembers ? (
                    <td className="space-y-2 py-3">
                      <form
                        action={changeMemberRoleAction}
                        className="flex gap-2"
                      >
                        <input type="hidden" name="locale" value={locale} />
                        <input
                          type="hidden"
                          name="memberId"
                          value={member.id}
                        />
                        <select
                          name="role"
                          defaultValue={member.role}
                          className="border-input bg-background rounded-md border px-2 py-1"
                        >
                          {workspaceRoles.map((role) => (
                            <option key={role} value={role}>
                              {t(`roles.${role}`)}
                            </option>
                          ))}
                        </select>
                        <button className="border-input hover:bg-accent rounded-md border px-3 py-1 font-medium">
                          {t("team.members.updateRole")}
                        </button>
                      </form>
                      <form
                        action={changeMemberStatusAction}
                        className="flex gap-2"
                      >
                        <input type="hidden" name="locale" value={locale} />
                        <input
                          type="hidden"
                          name="memberId"
                          value={member.id}
                        />
                        <select
                          name="status"
                          defaultValue={member.status}
                          className="border-input bg-background rounded-md border px-2 py-1"
                        >
                          <option value="ACTIVE">{t("status.ACTIVE")}</option>
                          <option value="INACTIVE">
                            {t("status.INACTIVE")}
                          </option>
                        </select>
                        <button className="border-input hover:bg-accent rounded-md border px-3 py-1 font-medium">
                          {t("team.members.updateStatus")}
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
