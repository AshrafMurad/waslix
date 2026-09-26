"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { TaskForm } from "./task-form";
import { TaskStatusButton } from "./task-status-button";

type TaskActionsMenuProps = React.ComponentProps<typeof TaskForm> & {
  editTitle: string;
  editDescription: string;
  editLabel: string;
  moreLabel: string;
  statusOperationKey: string;
  cancelOperationKey: string;
};

export function TaskActionsMenu({
  editTitle,
  editDescription,
  editLabel,
  moreLabel,
  statusOperationKey,
  cancelOperationKey,
  task,
  locale,
  ...formProps
}: TaskActionsMenuProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={moreLabel}
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {task.status !== "CANCELLED" ? (
            <TaskStatusButton
              taskId={task.id}
              customerId={task.customerId}
              locale={locale}
              status={task.status}
              operationKey={statusOperationKey}
              display="menu-item"
            />
          ) : null}
          {task.status !== "COMPLETED" && task.status !== "CANCELLED" ? (
            <TaskStatusButton
              taskId={task.id}
              customerId={task.customerId}
              locale={locale}
              status={task.status}
              operationKey={cancelOperationKey}
              targetStatus="CANCELLED"
              display="menu-item"
            />
          ) : null}
          {task.status !== "CANCELLED" ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil aria-hidden="true" />
            {editLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editTitle}</DialogTitle>
            <DialogDescription>{editDescription}</DialogDescription>
          </DialogHeader>
          <TaskForm
            {...formProps}
            locale={locale}
            task={task}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
