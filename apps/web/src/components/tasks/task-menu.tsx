"use client";

import {
  Archive,
  Check,
  MoreHorizontal,
  Pencil,
  Play,
  RotateCcw,
  Undo2,
} from "lucide-react";
import {
  allowedTransitions,
  type Status,
  type TaskDTO,
} from "@taskflow/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskActions } from "@/lib/tasks";
import { transitionLabel } from "@/lib/transitions";

function TransitionIcon({ from, to }: { from: Status; to: Status }) {
  if (from === "todo") return <Play className="h-4 w-4" aria-hidden="true" />;
  if (to === "done") return <Check className="h-4 w-4" aria-hidden="true" />;
  if (from === "done") return <RotateCcw className="h-4 w-4" aria-hidden="true" />;
  return <Undo2 className="h-4 w-4" aria-hidden="true" />;
}

export function TaskMenu({
  task,
  onEdit,
}: {
  task: TaskDTO;
  onEdit: (task: TaskDTO) => void;
}) {
  const actions = useTaskActions();
  const moves = allowedTransitions(task.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Task actions for ${task.title}`}
          className="h-8 w-8 text-muted"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onSelect={() => onEdit(task)}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {moves.map((to) => (
          <DropdownMenuItem key={to} onSelect={() => actions.move(task, to)}>
            <TransitionIcon from={task.status} to={to} />
            {transitionLabel(task.status, to)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => actions.archive(task)}>
          <Archive className="h-4 w-4" aria-hidden="true" />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
