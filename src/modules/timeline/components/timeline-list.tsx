import { Bot, UserRound } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

const taskEvents = new Set([
  "TASK_CREATED",
  "TASK_COMPLETED",
  "TASK_REOPENED",
  "TASK_CANCELLED",
]);

export async function TimelineList({
  locale,
  entries,
}: {
  locale: string;
  entries: Array<{
    id: string;
    kind: "activity" | "system";
    type: string;
    title: string;
    description: string | null;
    occurredAt: Date;
    actor: string | null;
  }>;
}) {
  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: "timeline" }),
    getFormatter({ locale }),
  ]);
  if (!entries.length) {
    return (
      <p className="text-muted-foreground p-6 text-center">{t("empty")}</p>
    );
  }
  return (
    <ol className="divide-y">
      {entries.map((entry) => {
        const Icon = entry.kind === "activity" ? UserRound : Bot;
        const title =
          entry.kind === "activity"
            ? entry.title
            : taskEvents.has(entry.type)
              ? t(`events.${entry.type}`)
              : t("system");
        return (
          <li key={`${entry.kind}-${entry.id}`} className="flex gap-4 p-5">
            <span
              className={
                entry.kind === "activity"
                  ? "bg-brand text-brand-foreground flex size-10 shrink-0 items-center justify-center rounded-full"
                  : "bg-raised text-information flex size-10 shrink-0 items-center justify-center rounded-md"
              }
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="font-medium" dir="auto">
                  {title}
                </p>
                <time
                  className="text-muted-foreground text-xs"
                  dateTime={entry.occurredAt.toISOString()}
                >
                  {format.dateTime(entry.occurredAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
              <p className="text-muted-foreground mt-1 text-sm" dir="auto">
                {entry.actor ?? t("system")}
              </p>
              {entry.description ? (
                <p className="mt-2 text-sm" dir="auto">
                  {entry.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
