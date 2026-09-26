"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { TaskForm } from "./task-form";

type TaskFormDialogProps = React.ComponentProps<typeof TaskForm> & {
  title: string;
  description: string;
  triggerLabel: string;
  mode: "create" | "edit";
  triggerStyle?: "button" | "menu-item";
};

export function TaskFormDialog({
  title,
  description,
  triggerLabel,
  mode,
  triggerStyle = "button",
  ...formProps
}: TaskFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerStyle === "menu-item" ? (
        <DropdownMenuItem onSelect={() => setOpen(true)}>
          <Pencil aria-hidden="true" />
          {triggerLabel}
        </DropdownMenuItem>
      ) : (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant={mode === "edit" ? "ghost" : "default"}
            size={mode === "edit" ? "default" : "lg"}
          >
            {mode === "create" ? <Plus aria-hidden="true" /> : null}
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <TaskForm {...formProps} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
