"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

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
    window.setTimeout(() => setCopied(false), 2400);
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
          size="icon-sm"
          onClick={copyInviteUrl}
          aria-label={copied ? copiedLabel : copyLabel}
          title={copied ? copiedLabel : copyLabel}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </Button>
        <Button asChild variant="outline" size="icon-sm">
          <a
            href={inviteUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={openLabel}
            title={openLabel}
          >
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
  );
}
