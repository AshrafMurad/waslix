"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { CustomerForm } from "./customer-form";

type CustomerFormDialogProps = React.ComponentProps<typeof CustomerForm> & {
  title: string;
  description: string;
  triggerLabel: string;
  mode: "create" | "edit";
};

export function CustomerFormDialog({
  title,
  description,
  triggerLabel,
  mode,
  ...formProps
}: CustomerFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={mode === "edit" ? "outline" : "default"}
          size={mode === "edit" ? "default" : "lg"}
          className={mode === "edit" ? "w-full" : undefined}
        >
          {mode === "create" ? <Plus aria-hidden="true" /> : null}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CustomerForm {...formProps} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
