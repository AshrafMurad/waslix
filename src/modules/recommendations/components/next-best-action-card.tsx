"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

import {
  acceptRecommendationAction,
  dismissRecommendationAction,
  type RecommendationActionState,
} from "../actions/recommendation-actions";

const initial: RecommendationActionState = { status: "idle" };

type RecommendationItem = {
  id: string;
  type: string;
  title: string;
  reason: string;
  priority: string;
  status: string;
  taskId: string | null;
  playbookRunId: string | null;
  ruleKey: string;
};

function stableOperationKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function RecommendationRow({
  recommendation,
  customerId,
  locale,
  canAct,
}: {
  recommendation: RecommendationItem;
  customerId: string;
  locale: string;
  canAct: boolean;
}) {
  const t = useTranslations("recommendations");
  const [acceptKey] = useState(stableOperationKey);
  const [dismissKey] = useState(stableOperationKey);
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptRecommendationAction,
    initial,
  );
  const [dismissState, dismissAction, dismissPending] = useActionState(
    dismissRecommendationAction,
    initial,
  );
  const error = acceptState.status === "error" || dismissState.status === "error";
  const reason = (() => {
    try {
      const parsed = JSON.parse(recommendation.reason) as { ruleKey?: string };
      return parsed.ruleKey ?? recommendation.ruleKey;
    } catch {
      return recommendation.ruleKey;
    }
  })();

  return (
    <li className="space-y-3 rounded-md border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {t(`types.${recommendation.type}`)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t(`rules.${reason}`)}
          </p>
        </div>
        <span className="bg-raised rounded-md px-2 py-1 text-xs font-medium">
          {t(`priority.${recommendation.priority}`)}
        </span>
      </div>
      {recommendation.status === "ACCEPTED" ? (
        <div className="flex flex-wrap gap-2">
          {recommendation.taskId ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/tasks">{t("actions.openTask")}</Link>
            </Button>
          ) : null}
          {recommendation.playbookRunId ? (
            <span className="text-information text-sm font-medium">
              {t("status.playbookStarted")}
            </span>
          ) : null}
        </div>
      ) : canAct ? (
        <div className="grid gap-2 md:grid-cols-[auto_minmax(12rem,1fr)_auto]">
          <form action={acceptAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="customerId" value={customerId} />
            <input
              type="hidden"
              name="recommendationId"
              value={recommendation.id}
            />
            <input type="hidden" name="operationKey" value={acceptKey} />
            <Button type="submit" size="sm" disabled={acceptPending}>
              {t("actions.accept")}
            </Button>
          </form>
          <form action={dismissAction} className="flex gap-2">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="customerId" value={customerId} />
            <input
              type="hidden"
              name="recommendationId"
              value={recommendation.id}
            />
            <input type="hidden" name="operationKey" value={dismissKey} />
            <Input
              name="reason"
              required
              maxLength={10000}
              placeholder={t("actions.reason")}
              className="min-w-0"
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={dismissPending}
            >
              {t("actions.dismiss")}
            </Button>
          </form>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-risk text-xs">
          {t("actions.failed")}
        </p>
      ) : null}
    </li>
  );
}

export function NextBestActionCard({
  recommendations,
  customerId,
  locale,
  canAct,
}: {
  recommendations: RecommendationItem[];
  customerId: string;
  locale: string;
  canAct: boolean;
}) {
  const t = useTranslations("recommendations");
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
      {recommendations.length ? (
        <ul className="mt-4 space-y-3">
          {recommendations.map((recommendation) => (
            <RecommendationRow
              key={recommendation.id}
              recommendation={recommendation}
              customerId={customerId}
              locale={locale}
              canAct={canAct}
            />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">{t("empty")}</p>
      )}
    </Card>
  );
}
