"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TaskDTO } from "@taskflow/shared";
import { useNow } from "@/hooks/use-now";
import { useTimeZone } from "@/hooks/use-time-zone";
import { cn } from "@/lib/cn";
import { formatDueDate } from "@/lib/format";
import { PriorityGlyph } from "./priority-glyph";
import { SlaBadge } from "./sla-badge";
import { StatusGlyph } from "./status-glyph";
import { TaskMenu } from "./task-menu";

export function TaskCard({
  task,
  onEdit,
  overlay = false,
}: {
  task: TaskDTO;
  onEdit?: (task: TaskDTO) => void;
  overlay?: boolean;
}) {
  const now = useNow();
  const timeZone = useTimeZone();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { status: task.status } });

  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={onEdit ? () => onEdit(task) : undefined}
      className={cn(
        "card-lift group relative rounded-lg border border-border bg-surface p-3",
        "hover:border-input",
        isDragging && "opacity-40",
        overlay && "w-[300px] cursor-grabbing shadow-float",
      )}
      style={
        transform && !overlay
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
    >
      <div className="flex items-start gap-2">
        <StatusGlyph status={task.status} className="mt-0.5" />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit?.(task);
          }}
          className="min-w-0 flex-1 rounded-sm text-left text-sm font-medium leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="break-words">{task.title}</span>
        </button>
        <PriorityGlyph priority={task.priority} className="mt-1.5" />
        <div className="-mr-1 -mt-1">
          <TaskMenu task={task} onEdit={onEdit ?? (() => undefined)} />
        </div>
      </div>

      {task.description ? (
        <p className="mt-2 line-clamp-2 pl-6 text-xs leading-4 text-muted">
          {task.description}
        </p>
      ) : null}

      <div className="mt-3 flex min-h-6 items-center justify-between gap-2 pl-6">
        <span className="text-xs leading-4 text-muted tabular">
          {task.dueDate ? formatDueDate(task.dueDate, timeZone, now) : ""}
        </span>
        <SlaBadge task={task} />
      </div>
    </article>
  );
}

export function TaskCardPreview({ task }: { task: TaskDTO }) {
  return (
    <article className="w-[300px] rounded-lg border border-border bg-surface p-3 shadow-float">
      <div className="flex items-start gap-2">
        <StatusGlyph status={task.status} className="mt-0.5" />
        <p className="min-w-0 flex-1 text-sm font-medium leading-5">
          {task.title}
        </p>
        <PriorityGlyph priority={task.priority} className="mt-1.5" />
      </div>
    </article>
  );
}
