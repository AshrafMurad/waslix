import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  LogIn,
  MailCheck,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { MarketingNavigation } from "@/components/marketing/marketing-navigation";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth/auth";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/modules/workspace/actions/workspace-invitation-actions";
import { getInvitationByToken } from "@/modules/workspace/services/workspace-invitations";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

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
  const isExpired =
    invitation?.status === "PENDING" && invitation.expiresAt <= new Date();
  const emailMatches =
    session && invitation
      ? normalizeEmail(session.user.email) === normalizeEmail(invitation.email)
      : false;
  const unavailableMessage = !invitation
    ? t("invite.invalid")
    : isExpired
      ? t("invite.expired")
      : invitation.status === "ACCEPTED"
        ? t("invite.accepted")
        : invitation.status === "REVOKED"
          ? t("invite.revoked")
          : t("invite.unavailable");

  return (
    <main className="marketing-shell invite-shell">
      <MarketingNavigation />
      <section
        className="marketing-container invite-stage"
        aria-labelledby="invite-title"
      >
        <div className="invite-visual" aria-hidden="true">
          <div className="invite-orbit invite-orbit-one" />
          <div className="invite-orbit invite-orbit-two" />
          <div className="invite-signal invite-signal-source">
            <MailCheck />
            <span>{t("invite.signalInvited")}</span>
          </div>
          <div className="invite-signal invite-signal-target">
            <ShieldCheck />
            <span>{t("invite.signalScoped")}</span>
          </div>
        </div>

        <div className="invite-panel">
          <div className="invite-panel-header">
            <span
              className="invite-status-mark"
              data-state={unavailable ? "off" : "on"}
            >
              {unavailable ? <Ban /> : <MailCheck />}
            </span>
            <div>
              <h1 id="invite-title">{t("invite.title")}</h1>
              <p>
                {invitation
                  ? t("invite.description", {
                      workspace: invitation.workspace.name,
                    })
                  : t("invite.invalid")}
              </p>
            </div>
          </div>

          {invitation ? (
            <dl className="invite-ledger">
              <div>
                <dt>{t("invite.workspace")}</dt>
                <dd>{invitation.workspace.name}</dd>
              </div>
              <div>
                <dt>{t("invite.invitedEmail")}</dt>
                <dd dir="ltr">{invitation.email}</dd>
              </div>
              <div>
                <dt>{t("invite.expires")}</dt>
                <dd>{invitation.expiresAt.toLocaleDateString(locale)}</dd>
              </div>
            </dl>
          ) : null}

          <div className="invite-action-surface">
            {unavailable ? (
              <div className="invite-message" data-tone="blocked">
                <Ban aria-hidden="true" />
                <div>
                  <strong>{unavailableMessage}</strong>
                  <p>{t("invite.unavailableRecovery")}</p>
                </div>
              </div>
            ) : session && emailMatches ? (
              <div className="invite-stack">
                <div className="invite-message" data-tone="ready">
                  <CheckCircle2 aria-hidden="true" />
                  <div>
                    <strong>{t("invite.readyTitle")}</strong>
                    <p>
                      {t("invite.signedInAs", { email: session.user.email })}
                    </p>
                  </div>
                </div>
                <div className="invite-actions">
                  <form action={acceptInvitationAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="token" value={token} />
                    <button
                      className="marketing-button marketing-button-primary"
                      type="submit"
                    >
                      {t("invite.accept")}
                      <ArrowRight aria-hidden="true" />
                    </button>
                  </form>
                  <form action={declineInvitationAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="token" value={token} />
                    <button
                      className="marketing-button marketing-button-secondary"
                      type="submit"
                    >
                      {t("invite.decline")}
                    </button>
                  </form>
                </div>
              </div>
            ) : session ? (
              <div className="invite-stack">
                <div className="invite-message" data-tone="blocked">
                  <UserRound aria-hidden="true" />
                  <div>
                    <strong>{t("invite.emailMismatchTitle")}</strong>
                    <p>
                      {t("invite.emailMismatchDescription", {
                        currentEmail: session.user.email,
                        invitedEmail: invitation?.email ?? "",
                      })}
                    </p>
                  </div>
                </div>
                <div className="invite-actions">
                  <SignOutButton
                    className="marketing-button marketing-button-primary w-auto justify-center"
                    redirectTo={`/sign-in?invite=${token}`}
                    unstyled
                  />
                  <Link
                    href="/overview"
                    className="marketing-button marketing-button-secondary"
                  >
                    {t("invite.keepCurrentSession")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="invite-stack">
                <div className="invite-message" data-tone="ready">
                  <Clock3 aria-hidden="true" />
                  <div>
                    <strong>{t("invite.signInTitle")}</strong>
                    <p>{t("invite.signInDescription")}</p>
                  </div>
                </div>
                <div className="invite-actions">
                  <Link
                    href={`/sign-in?invite=${token}`}
                    className="marketing-button marketing-button-primary"
                  >
                    <LogIn aria-hidden="true" />
                    {t("invite.signIn")}
                  </Link>
                  <Link
                    href={`/sign-up?invite=${token}`}
                    className="marketing-button marketing-button-secondary"
                  >
                    {t("invite.signUp")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
