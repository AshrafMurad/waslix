"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InvitationLinkField({
  copiedLabel,
  copyLabel,
  inviteUrl,
  openLabel,
}: {
  copiedLabel: string;
  copyLabel: string;
  inviteUrl: string;
  openLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyInviteUrl() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  }

  return (
    <div className="flex min-w-72 flex-col gap-2 sm:flex-row">
      <Input
        aria-label={openLabel}
        className="font-mono text-xs"
        dir="ltr"
        readOnly
        value={inviteUrl}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyInviteUrl}
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={inviteUrl} target="_blank" rel="noreferrer">
            {openLabel}
          </a>
        </Button>
      </div>
    </div>
  );
}
