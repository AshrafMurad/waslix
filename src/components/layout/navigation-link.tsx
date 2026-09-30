"use client";

import {
  BarChart3,
  CheckSquare2,
  CircleAlert,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";

type NavigationLinkProps = {
  href: string;
  label: string;
  icon: NavigationIconKey;
  closeOnNavigate?: boolean;
};

export type NavigationIconKey =
  | "analytics"
  | "customers"
  | "overview"
  | "renewals"
  | "risks"
  | "settings"
  | "tasks"
  | "team";

const icons = {
  analytics: BarChart3,
  customers: UsersRound,
  overview: LayoutDashboard,
  renewals: RefreshCw,
  risks: CircleAlert,
  settings: Settings,
  tasks: CheckSquare2,
  team: Users,
} satisfies Record<NavigationIconKey, typeof LayoutDashboard>;

export function NavigationLink({
  href,
  label,
  icon,
  closeOnNavigate = false,
}: NavigationLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = icons[icon];
  const link = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-visible:bg-raised flex min-h-10 items-center gap-3 rounded-md border px-3 font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:translate-x-0.5 rtl:hover:-translate-x-0.5",
        active
          ? "border-brand/30 bg-brand/10 text-brand-accent shadow-[inset_3px_0_0_var(--brand)] rtl:shadow-[inset_-3px_0_0_var(--brand)]"
          : "text-muted-foreground hover:bg-raised hover:text-foreground hover:border-border/80 border-transparent",
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      <span>{label}</span>
    </Link>
  );

  return closeOnNavigate ? <SheetClose asChild>{link}</SheetClose> : link;
}
