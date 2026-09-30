import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth/auth";
import { acceptInvitationAction } from "@/modules/workspace/actions/workspace-invitation-actions";
import { getInvitationByToken } from "@/modules/workspace/services/workspace-invitations";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [invitation, session, t] = await Promise.all([
    getInvitationByToken(token),
    auth.api.getSession({ headers: await headers() }),
    getTranslations({ locale, namespace: "workspace" }),
  ]);

  const unavailable =
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.expiresAt <= new Date();

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{t("invite.title")}</CardTitle>
          <CardDescription>
            {invitation
              ? t("invite.description", {
                  workspace: invitation.workspace.name,
                })
              : t("invite.invalid")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {unavailable ? (
            <p className="text-risk text-sm">{t("invite.unavailable")}</p>
          ) : session ? (
            <form action={acceptInvitationAction} className="space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="token" value={token} />
              <p className="text-muted-foreground text-sm">
                {t("invite.signedInAs", { email: session.user.email })}
              </p>
              <Button>{t("invite.accept")}</Button>
            </form>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={`/sign-in?invite=${token}`}>
                  {t("invite.signIn")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/sign-up?invite=${token}`}>
                  {t("invite.signUp")}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
