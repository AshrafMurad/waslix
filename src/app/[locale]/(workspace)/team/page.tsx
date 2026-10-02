import { randomUUID } from "node:crypto";

import {
  ArrowRightLeft,
  MailPlus,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { serverEnvironment } from "@/config/server-env";
import { isLocale } from "@/i18n/config";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import {
  hasWorkspaceCapability,
  workspaceRoles,
} from "@/lib/permissions/roles";
import {
  changeMemberRoleAction,
  changeMemberStatusAction,
} from "@/modules/workspace/actions/team-settings-actions";
import {
  deleteWorkspaceInvitationAction,
  resendWorkspaceInvitationAction,
  revokeWorkspaceInvitationAction,
} from "@/modules/workspace/actions/workspace-invitation-actions";
import { InvitationLinkField } from "@/modules/workspace/components/invitation-link-field";
import { OwnershipTransferFromSelect } from "@/modules/workspace/components/ownership-transfer-from-select";
import {
  InviteMemberForm,
  OwnershipTransferForm,
} from "@/modules/workspace/components/team-validation-forms";
import { getWorkspaceMembers } from "@/modules/workspace/queries/get-workspace-members";
import { getWorkspaceInvitations } from "@/modules/workspace/services/workspace-invitations";
import {
  getOwnershipTransferPreview,
  totalPreviewCount,
} from "@/modules/workspace/services/ownership-transfer";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function createInvitationUrl(locale: string, token: string) {
  return new URL(
    `/${locale}/invite/${encodeURIComponent(token)}`,
    serverEnvironment.BETTER_AUTH_URL,
  ).toString();
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
  const canManageMembers = hasWorkspaceCapability(
    access.role,
    "manageWorkspaceMembership",
  );
  const [members, invitations, t] = await Promise.all([
    getWorkspaceMembers(access),
    canManageMembers ? getWorkspaceInvitations(access) : Promise.resolve([]),
    getTranslations({ locale, namespace: "workspace" }),
  ]);
  const preview = fromMemberId
    ? await getOwnershipTransferPreview(access, fromMemberId)
    : null;
  const eligibleTargets = members.filter(
    (member) =>
      member.status === "ACTIVE" &&
      ["ADMIN", "CS_MANAGER", "CSM"].includes(member.role),
  );
  const activeMemberCount = members.filter(
    (member) => member.status === "ACTIVE",
  ).length;
  const pendingInvitationCount = invitations.filter(
    (invitation) => invitation.status === "PENDING",
  ).length;

  return (
    <div className="waslix-page flex flex-col gap-7 space-y-0 md:gap-9 md:space-y-0">
      <div className="order-1 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-2">
          <h1 className="waslix-page-title">{t("team.title")}</h1>
          <p className="waslix-page-description">{t("team.description")}</p>
        </div>
        <dl className="bg-raised/50 grid grid-cols-2 rounded-md border">
          <div className="min-w-32 px-4 py-3">
            <dt className="text-muted-foreground text-xs font-medium">
              {t("team.summary.activeMembers")}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {activeMemberCount}
            </dd>
          </div>
          <div className="min-w-32 border-s px-4 py-3">
            <dt className="text-muted-foreground text-xs font-medium">
              {t("team.summary.pendingInvites")}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {pendingInvitationCount}
            </dd>
          </div>
        </dl>
      </div>

      <Card className="order-3">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="bg-brand/10 text-brand-accent flex size-9 items-center justify-center rounded-md">
              <MailPlus aria-hidden="true" className="size-4" />
            </span>
            <CardTitle>{t("team.invite.title")}</CardTitle>
          </div>
          <CardDescription>{t("team.invite.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {canManageMembers ? <InviteMemberForm locale={locale} /> : null}

          <div className="overflow-x-auto">
            <Table className="min-w-[54rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("team.invite.email")}</TableHead>
                  <TableHead>{t("team.invite.role")}</TableHead>
                  <TableHead>{t("team.invite.status")}</TableHead>
                  <TableHead>{t("team.invite.expires")}</TableHead>
                  <TableHead>{t("team.invite.link")}</TableHead>
                  {canManageMembers ? (
                    <TableHead>{t("team.invite.actions")}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length ? (
                  invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{t(`roles.${invitation.role}`)}</TableCell>
                      <TableCell>
                        {t(`invitationStatus.${invitation.status}`)}
                      </TableCell>
                      <TableCell>
                        {invitation.expiresAt.toLocaleDateString(locale)}
                      </TableCell>
                      <TableCell>
                        {invitation.status === "PENDING" &&
                        invitation.expiresAt > new Date() &&
                        invitation.token ? (
                          <InvitationLinkField
                            copiedLabel={t("team.invite.copied")}
                            copyLabel={t("team.invite.copyLink")}
                            inviteUrl={createInvitationUrl(
                              locale,
                              invitation.token,
                            )}
                            openLabel={t("team.invite.openLink")}
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {t("team.invite.linkUnavailable")}
                          </span>
                        )}
                      </TableCell>
                      {canManageMembers ? (
                        <TableCell className="flex flex-wrap gap-2">
                          <form action={resendWorkspaceInvitationAction}>
                            <input type="hidden" name="locale" value={locale} />
                            <input
                              type="hidden"
                              name="invitationId"
                              value={invitation.id}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={invitation.status !== "PENDING"}
                            >
                              {t("team.invite.resend")}
                            </Button>
                          </form>
                          <form action={revokeWorkspaceInvitationAction}>
                            <input type="hidden" name="locale" value={locale} />
                            <input
                              type="hidden"
                              name="invitationId"
                              value={invitation.id}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={invitation.status !== "PENDING"}
                            >
                              {t("team.invite.revoke")}
                            </Button>
                          </form>
                          <form action={deleteWorkspaceInvitationAction}>
                            <input type="hidden" name="locale" value={locale} />
                            <input
                              type="hidden"
                              name="invitationId"
                              value={invitation.id}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                invitation.status !== "PENDING" &&
                                invitation.status !== "REVOKED"
                              }
                            >
                              <Trash2 aria-hidden="true" />
                              {t("team.invite.delete")}
                            </Button>
                          </form>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={canManageMembers ? 6 : 5}
                      className="py-10 text-center"
                    >
                      <MailPlus
                        aria-hidden="true"
                        className="text-muted-foreground mx-auto mb-3 size-5"
                      />
                      <p className="font-medium">{t("team.invite.empty")}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {t("team.invite.emptyDescription")}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-attention/35 order-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="bg-attention/10 text-attention flex size-9 items-center justify-center rounded-md">
              <ArrowRightLeft aria-hidden="true" className="size-4" />
            </span>
            <CardTitle>{t("team.transfer.title")}</CardTitle>
          </div>
          <CardDescription>{t("team.transfer.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-raised rounded-md border p-4">
            <OwnershipTransferFromSelect
              members={members}
              selectedMemberId={fromMemberId ?? ""}
              label={t("team.transfer.from")}
              placeholder={t("team.transfer.chooseMember")}
              helper={t("team.transfer.autoPreview")}
            />
          </div>

          {preview && fromMemberId ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full md:hidden" variant="outline">
                  {t("team.transfer.viewDetails")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("team.transfer.title")}</DialogTitle>
                  <DialogDescription>
                    {t("team.transfer.description")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
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
                <OwnershipTransferForm
                  locale={locale}
                  fromMemberId={fromMemberId}
                  operationKey={randomUUID()}
                  targets={eligibleTargets.filter(
                    (member) => member.id !== fromMemberId,
                  )}
                  disabled={totalPreviewCount(preview) === 0}
                  compact
                />
              </DialogContent>
            </Dialog>
          ) : null}

          {preview && fromMemberId ? (
            <div className="bg-raised hidden space-y-4 rounded-md border p-4 md:block">
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
              <OwnershipTransferForm
                locale={locale}
                fromMemberId={fromMemberId}
                operationKey={randomUUID()}
                targets={eligibleTargets.filter(
                  (member) => member.id !== fromMemberId,
                )}
                disabled={totalPreviewCount(preview) === 0}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="order-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="bg-brand/10 text-brand-accent flex size-9 items-center justify-center rounded-md">
              <UsersRound aria-hidden="true" className="size-4" />
            </span>
            <CardTitle>{t("team.members.title")}</CardTitle>
          </div>
          <CardDescription>{t("team.members.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[72rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("team.members.member")}</TableHead>
                  <TableHead>{t("team.members.role")}</TableHead>
                  <TableHead>{t("team.members.status")}</TableHead>
                  <TableHead>{t("team.members.ownership")}</TableHead>
                  {canManageMembers ? (
                    <TableHead>{t("team.members.actions")}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="align-top">
                    <TableCell>
                      <div className="flex min-w-56 items-center gap-3">
                        <span className="bg-brand text-brand-foreground flex size-9 shrink-0 items-center justify-center rounded-md font-semibold">
                          {member.user.name
                            .trim()
                            .charAt(0)
                            .toLocaleUpperCase(locale) || "W"}
                        </span>
                        <div>
                          <p className="font-medium" dir="auto">
                            {member.user.name}
                          </p>
                          <p className="text-muted-foreground" dir="auto">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{t(`roles.${member.role}`)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${member.status === "ACTIVE" ? "border-healthy/25 bg-healthy/8 text-healthy" : "text-muted-foreground"}`}
                      >
                        {member.status === "ACTIVE" ? (
                          <ShieldCheck aria-hidden="true" className="size-3" />
                        ) : null}
                        {t(`status.${member.status}`)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {t("team.members.ownershipSummary", {
                        customers: member._count.customers,
                        tasks: member._count.ownedTasks,
                        risks: member._count.ownedRisks,
                        goals: member._count.ownedGoals,
                      })}
                    </TableCell>
                    {canManageMembers ? (
                      <TableCell className="space-y-2">
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
                          <Select name="role" defaultValue={member.role}>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {workspaceRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {t(`roles.${role}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm">
                            {t("team.members.updateRole")}
                          </Button>
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
                          <Select name="status" defaultValue={member.status}>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">
                                {t("status.ACTIVE")}
                              </SelectItem>
                              <SelectItem value="INACTIVE">
                                {t("status.INACTIVE")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm">
                            {t("team.members.updateStatus")}
                          </Button>
                        </form>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
