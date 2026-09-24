"use client";

import { ChevronDown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";

export function AccountMenu({
  accountLabel,
  roleLabel,
  roleValue,
  user,
  userInitial,
}: {
  accountLabel: string;
  roleLabel: string;
  roleValue: string;
  user: { name: string; email: string };
  userInitial: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 px-1 pe-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-brand text-brand-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <span
            className="hidden max-w-32 truncate text-sm font-medium lg:block"
            dir="auto"
          >
            {user.name}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="text-muted-foreground hidden size-4 lg:block"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          {accountLabel}
        </DropdownMenuLabel>
        <DropdownMenuGroup className="px-2 py-2">
          <p className="truncate font-medium" dir="auto">
            {user.name}
          </p>
          <p className="text-muted-foreground truncate text-xs" dir="ltr">
            {user.email}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {roleLabel}: {roleValue}
          </p>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <SignOutButton className="mt-0 h-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
