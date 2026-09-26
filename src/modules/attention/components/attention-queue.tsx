"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

import {
  changeAttentionAction,
  type AttentionActionState,
} from "../actions/attention-actions";

const initial: AttentionActionState = { status: "idle" };

type Item = {
  id: string;
  priority: string;
  status: string;
  reasonKeys: string[];
  healthDelta: number | null;
  customer: {
    id: string;
    name: string;
    renewalDate: string | null;
    ownerName: string;
    healthScore: number | null;
    recommendations?: { id: string }[];
  };
};

function AttentionRow({
  item,
  locale,
  canAct,
}: {
  item: Item;
  locale: string;
  canAct: boolean;
}) {
  const t = useTranslations("attention");
  const [state, action, pending] = useActionState(
    changeAttentionAction,
    initial,
  );
  return (
    <li className="grid gap-4 p-5 lg:grid-cols-[minmax(12rem,1.1fr)_minmax(14rem,1.6fr)_minmax(8rem,.7fr)_minmax(12rem,1fr)] lg:items-center">
      <div>
        <Link
          href={`/customers/${item.customer.id}`}
          className="font-semibold hover:underline"
          dir="auto"
        >
          {item.customer.name}
        </Link>
        <p className="text-muted-foreground mt-1 text-xs" dir="auto">
          {item.customer.ownerName}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {item.reasonKeys.map((reason) => (
          <span key={reason} className="bg-raised rounded-md px-2 py-1 text-xs">
            {t(`reasons.${reason}`)}
          </span>
        ))}
      </div>
      <div className="text-sm tabular-nums">
        <p
          className={
            item.priority === "CRITICAL" || item.priority === "HIGH"
              ? "text-risk font-medium"
              : "text-attention font-medium"
          }
        >
          {t(`priority.${item.priority}`)}
        </p>
        <p className="text-muted-foreground mt-1">
          {item.customer.healthScore == null
            ? t("healthUnknown")
            : t("health", { score: item.customer.healthScore })}
        </p>
        {item.healthDelta != null ? (
          <p className="text-muted-foreground text-xs">
            {t("trend", { delta: item.healthDelta })}
          </p>
        ) : null}
      </div>
      <div>
        {item.customer.renewalDate ? (
          <p className="text-muted-foreground mb-2 text-xs">
            {t("renewal", { date: item.customer.renewalDate })}
          </p>
        ) : null}
        {item.customer.recommendations?.length ? (
          <Button asChild size="sm" variant="outline" className="mb-2">
            <Link href={`/customers/${item.customer.id}`}>
              {t("actions.viewNextAction")}
            </Link>
          </Button>
        ) : null}
        {canAct ? (
          <div className="space-y-2">
            {item.status === "OPEN" ? (
              <form action={action}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="status" value="ACKNOWLEDGED" />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                >
                  {t("actions.acknowledge")}
                </Button>
              </form>
            ) : null}
            <form action={action} className="flex gap-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="status" value="DISMISSED" />
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
                disabled={pending}
              >
                {t("actions.dismiss")}
              </Button>
            </form>
          </div>
        ) : null}
        {state.status === "error" ? (
          <p role="alert" className="text-risk mt-2 text-xs">
            {t("actions.failed")}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function AttentionQueue({
  items,
  locale,
  canAct,
}: {
  items: Item[];
  locale: string;
  canAct: boolean;
}) {
  const t = useTranslations("attention");
  if (!items.length)
    return <p className="text-muted-foreground p-6">{t("empty")}</p>;
  return (
    <ul className="divide-y">
      {items.map((item) => (
        <AttentionRow
          key={item.id}
          item={item}
          locale={locale}
          canAct={canAct}
        />
      ))}
    </ul>
  );
}
