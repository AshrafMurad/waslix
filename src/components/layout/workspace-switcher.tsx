"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-surface h-12 w-full justify-start gap-3 px-3"
        >
          <span className="bg-brand text-brand-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
            <Building2 aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0 flex-1 text-start">
            <span className="block truncate text-sm font-medium" dir="auto">
              {activeWorkspace?.name}
            </span>
            <span className="text-muted-foreground block text-xs font-normal">
              {t("label")}
            </span>
          </span>
          <ChevronsUpDown
            aria-hidden="true"
            className="text-muted-foreground size-4"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width)"
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          {t("choose")}
        </DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            disabled={isPending}
            onSelect={() => switchWorkspace(workspace.id)}
            className="min-h-10"
          >
            <span className="min-w-0 flex-1 truncate" dir="auto">
              {workspace.name}
            </span>
            {workspace.id === activeWorkspaceId ? (
              <Check aria-hidden="true" className="text-brand-accent size-4" />
            ) : null}
          </DropdownMenuItem>
        ))}
        {error ? (
          <p role="alert" className="text-risk px-2 py-1.5 text-xs">
            {t("error")}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
