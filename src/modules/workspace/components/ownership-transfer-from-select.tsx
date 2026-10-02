"use client";

import { useState, useTransition } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";

export function OwnershipTransferFromSelect({
  members,
  selectedMemberId,
  label,
  placeholder,
  helper,
}: {
  members: Array<{ id: string; user: { name: string; email: string } }>;
  selectedMemberId: string;
  label: string;
  placeholder: string;
  helper: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(selectedMemberId);
  const [pending, startTransition] = useTransition();

  function selectMember(memberId: string) {
    setValue(memberId);
    const params = new URLSearchParams({ fromMemberId: memberId });
    startTransition(() => {
      router.replace(`/team?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="min-w-0 space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={selectMember} disabled={pending}>
        <SelectTrigger className="w-full min-w-0 md:w-80">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.user.name} ({member.user.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-xs">{helper}</p>
    </div>
  );
}
