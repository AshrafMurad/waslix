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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  inviteWorkspaceMemberAction,
  resendWorkspaceInvitationAction,
  revokeWorkspaceInvitationAction,
} from "@/modules/workspace/actions/workspace-invitation-actions";
import { OwnershipTransferFromSelect } from "@/modules/workspace/components/ownership-transfer-from-select";
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

  return (
    <div className="waslix-page">
      <div className="space-y-1">
        <h1 className="waslix-page-title">{t("team.title")}</h1>
        <p className="waslix-page-description">{t("team.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("team.invite.title")}</CardTitle>
          <CardDescription>{t("team.invite.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {canManageMembers ? (
            <form
              action={inviteWorkspaceMemberAction}
              className="bg-raised grid gap-4 rounded-md border p-4 md:grid-cols-[minmax(16rem,1fr)_12rem_auto] md:items-end"
            >
              <input type="hidden" name="locale" value={locale} />
              <div className="space-y-2">
                <Label htmlFor="invite-email">{t("team.invite.email")}</Label>
                <Input id="invite-email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">{t("team.invite.role")}</Label>
                <Select name="role" defaultValue="CSM">
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["CS_MANAGER", "CSM", "VIEWER"] as const).map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(`roles.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button>{t("team.invite.send")}</Button>
            </form>
          ) : null}

          <div className="overflow-x-auto">
            <Table className="min-w-[54rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("team.invite.email")}</TableHead>
                  <TableHead>{t("team.invite.role")}</TableHead>
                  <TableHead>{t("team.invite.status")}</TableHead>
                  <TableHead>{t("team.invite.expires")}</TableHead>
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
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={canManageMembers ? 5 : 4}
                      className="text-muted-foreground"
                    >
                      {t("team.invite.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("team.transfer.title")}</CardTitle>
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
                <form action={transferOwnershipAction} className="grid gap-4">
                  <input type="hidden" name="locale" value={locale} />
                  <input
                    type="hidden"
                    name="fromMemberId"
                    value={fromMemberId}
                  />
                  <input
                    type="hidden"
                    name="operationKey"
                    value={randomUUID()}
                  />
                  <div className="min-w-0 space-y-2">
                    <Label>{t("team.transfer.to")}</Label>
                    <Select name="toMemberId" required>
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue
                          placeholder={t("team.transfer.chooseTarget")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleTargets
                          .filter((member) => member.id !== fromMemberId)
                          .map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.user.name} ({member.user.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    disabled={totalPreviewCount(preview) === 0}
                  >
                    {t("team.transfer.apply")}
                  </Button>
                </form>
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
              <form
                action={transferOwnershipAction}
                className="grid gap-4 border-t pt-4 md:grid-cols-[minmax(18rem,auto)_auto_1fr] md:items-end"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="fromMemberId" value={fromMemberId} />
                <input type="hidden" name="operationKey" value={randomUUID()} />
                <div className="min-w-0 space-y-2">
                  <Label>{t("team.transfer.to")}</Label>
                  <Select name="toMemberId" required>
                    <SelectTrigger className="w-full min-w-0 md:w-80">
                      <SelectValue
                        placeholder={t("team.transfer.chooseTarget")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleTargets
                        .filter((member) => member.id !== fromMemberId)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.user.name} ({member.user.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="md:-translate-y-2 md:justify-self-start"
                  disabled={totalPreviewCount(preview) === 0}
                >
                  {t("team.transfer.apply")}
                </Button>
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
                      <p className="font-medium" dir="auto">
                        {member.user.name}
                      </p>
                      <p className="text-muted-foreground" dir="auto">
                        {member.user.email}
                      </p>
                    </TableCell>
                    <TableCell>{t(`roles.${member.role}`)}</TableCell>
                    <TableCell>{t(`status.${member.status}`)}</TableCell>
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
