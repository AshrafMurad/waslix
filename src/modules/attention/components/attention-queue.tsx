"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { EllipsisIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

import {
  changeAttentionAction,
  type AttentionActionState,
} from "../actions/attention-actions";

const initial: AttentionActionState = { status: "idle" };
const INITIAL_VISIBLE_COUNT = 6;

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
    <li className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(12rem,1.1fr)_minmax(14rem,1.7fr)_minmax(8rem,.7fr)_auto] lg:items-center">
      <div className="min-w-0">
        <Link
          href={`/customers/${item.customer.id}`}
          className="block truncate rounded-sm font-semibold hover:underline"
          dir="auto"
        >
          {item.customer.name}
        </Link>
        <p className="text-muted-foreground mt-1 text-xs" dir="auto">
          {item.customer.ownerName}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {item.reasonKeys.slice(0, 3).map((reason) => (
          <span key={reason} className="bg-raised rounded-md px-2 py-1 text-xs">
            {t(`reasons.${reason}`)}
          </span>
        ))}
        {item.reasonKeys.length > 3 ? (
          <span className="text-muted-foreground rounded-md border px-2 py-1 text-xs">
            {t("moreReasons", { count: item.reasonKeys.length - 3 })}
          </span>
        ) : null}
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
      <div className="flex items-center justify-end gap-3">
        {item.customer.renewalDate ? (
          <p className="text-muted-foreground text-xs">
            {t("renewal", { date: item.customer.renewalDate })}
          </p>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 shrink-0"
              aria-label={t("actions.label")}
            >
              <EllipsisIcon className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t("actions.label")}
            </DropdownMenuLabel>
            {item.customer.recommendations?.length ? (
              <DropdownMenuItem asChild>
                <Link href={`/customers/${item.customer.id}`}>
                  {t("actions.viewNextAction")}
                </Link>
              </DropdownMenuItem>
            ) : null}
            {canAct && item.status === "OPEN" ? (
              <DropdownMenuItem asChild disabled={pending}>
                <form action={action} className="w-full">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="status" value="ACKNOWLEDGED" />
                  <button
                    type="submit"
                    className="w-full text-start"
                    disabled={pending}
                  >
                    {t("actions.acknowledge")}
                  </button>
                </form>
              </DropdownMenuItem>
            ) : null}
            {canAct ? (
              <>
                <DropdownMenuSeparator />
                <div
                  className="space-y-2 p-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <form action={action} className="space-y-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="status" value="DISMISSED" />
                    <Input
                      name="reason"
                      required
                      maxLength={10000}
                      placeholder={t("actions.reason")}
                      aria-label={t("actions.reason")}
                      className="h-9"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      aria-busy={pending}
                      className="w-full"
                    >
                      {t("actions.dismiss")}
                    </Button>
                  </form>
                </div>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        {state.status === "error" ? (
          <p role="alert" className="text-risk text-xs lg:col-span-2">
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
  const direction = locale === "ar" ? "rtl" : "ltr";
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const visibleItems = items.slice(0, visibleCount);
  const hiddenCount = items.length - visibleItems.length;
  if (!items.length)
    return (
      <Empty className="rounded-none border-0" dir={direction}>
        <EmptyDescription>{t("empty")}</EmptyDescription>
      </Empty>
    );
  return (
    <div dir={direction}>
      <ul className="divide-y">
        {visibleItems.map((item) => (
          <AttentionRow
            key={item.id}
            item={item}
            locale={locale}
            canAct={canAct}
          />
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <div className="border-t p-4 text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setVisibleCount((count) => count + INITIAL_VISIBLE_COUNT)
            }
          >
            {t("showMore", { count: hiddenCount })}
          </Button>
        </div>
      ) : items.length > INITIAL_VISIBLE_COUNT ? (
        <div className="border-t p-4 text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setVisibleCount(INITIAL_VISIBLE_COUNT)}
          >
            {t("showLess")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
