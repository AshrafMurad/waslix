"use client";

import { cn } from "cn";

import { Link, usePathname } from "@/i18n/navigation";

const tabs = [
  "overview",
  "health",
  "timeline",
  "onboarding",
  "risks",
  "tasks",
  "renewal",
  "contacts",
] as const;

type CustomerTab = (typeof tabs)[number];

type CustomerTabsProps = {
  customerId: string;
  label: string;
  labels: Record<CustomerTab, string>;
};

export function CustomerTabs({ customerId, label, labels }: CustomerTabsProps) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const lastSegment = parts.at(-1);
  const activeTab: CustomerTab = tabs.includes(lastSegment as CustomerTab)
    ? (lastSegment as CustomerTab)
    : "overview";

  return (
    <nav aria-label={label} className="overflow-x-auto border-b">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Link
              key={tab}
              href={
                tab === "overview"
                  ? `/customers/${customerId}`
                  : `/customers/${customerId}/${tab}`
              }
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "hover:bg-raised min-h-10 rounded-t-md px-3 py-2 font-medium whitespace-nowrap",
                isActive
                  ? "border-brand text-foreground border-b-2"
                  : "text-muted-foreground",
              )}
            >
              {labels[tab]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
