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

import { TaskForm } from "./task-form";

type TaskFormDialogProps = React.ComponentProps<typeof TaskForm> & {
  title: string;
  description: string;
  triggerLabel: string;
  mode: "create" | "edit";
};

export function TaskFormDialog({
  title,
  description,
  triggerLabel,
  mode,
  ...formProps
}: TaskFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
