"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { useRouter } from "@/i18n/navigation";
import { switchWorkspaceAction } from "@/modules/workspace/actions/switch-workspace";

type WorkspaceSwitcherProps = {
  activeWorkspaceId: string;
  workspaces: Array<{ id: string; name: string }>;
};

export function WorkspaceSwitcher({
  activeWorkspaceId,
  workspaces,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const t = useTranslations("shell.workspace");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );

  function switchWorkspace(workspaceId: string) {
    if (workspaceId === activeWorkspaceId) return;

    setError(false);
    startTransition(async () => {
      try {
        const result = await switchWorkspaceAction({ workspaceId });
        if (!result.ok) {
          setError(true);
          return;
        }

        router.replace("/overview");
        router.refresh();
      } catch {
        setError(true);
      }
    });
  }

  return (
    <details className="group relative">
      <summary className="bg-surface hover:bg-raised flex min-h-12 list-none items-center gap-3 rounded-md border px-3 transition-colors [&::-webkit-details-marker]:hidden">
        <span className="bg-brand text-brand-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
          <Building2 aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block truncate text-sm font-medium" dir="auto">
            {activeWorkspace?.name}
          </span>
          <span className="text-muted-foreground block text-xs">
            {t("label")}
          </span>
        </span>
        <ChevronsUpDown
          aria-hidden="true"
          className="text-muted-foreground size-4"
        />
      </summary>
      <div className="bg-popover absolute inset-x-0 z-30 mt-2 rounded-md border p-1 shadow-lg">
        <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
          {t("choose")}
        </p>
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            disabled={isPending}
            onClick={() => switchWorkspace(workspace.id)}
            className="hover:bg-raised flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-start text-sm disabled:opacity-50"
          >
            <span className="min-w-0 flex-1 truncate" dir="auto">
              {workspace.name}
            </span>
            {workspace.id === activeWorkspaceId ? (
              <Check aria-hidden="true" className="text-brand-accent size-4" />
            ) : null}
          </button>
        ))}
        {error ? (
          <p role="alert" className="text-risk px-2 py-1.5 text-xs">
            {t("error")}
          </p>
        ) : null}
      </div>
    </details>
  );
}
