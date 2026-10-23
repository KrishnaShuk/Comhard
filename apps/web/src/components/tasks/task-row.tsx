"use client";

import type { TaskDTO } from "@taskflow/shared";
import { useNow } from "@/hooks/use-now";
import { useTimeZone } from "@/hooks/use-time-zone";
import { formatDueDate } from "@/lib/format";
import { PriorityGlyph } from "./priority-glyph";
import { SlaBadge } from "./sla-badge";
import { StatusGlyph } from "./status-glyph";
import { StatusPill } from "./status-pill";
import { TaskMenu } from "./task-menu";

export function TaskRow({
  task,
  onEdit,
}: {
  task: TaskDTO;
  onEdit: (task: TaskDTO) => void;
}) {
  const now = useNow();
  const timeZone = useTimeZone();

  return (
    <div className="grid h-12 grid-cols-[minmax(0,1fr)_auto_32px] items-center gap-3 border-b border-border px-3 transition-colors duration-100 hover:bg-accent-tint/40 sm:grid-cols-[minmax(0,1fr)_92px_140px_32px] md:grid-cols-[minmax(0,1fr)_128px_92px_140px_32px]">
      <div className="flex min-w-0 items-center gap-2">
        <StatusGlyph status={task.status} />
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="min-w-0 truncate rounded-sm text-left text-sm leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {task.title}
        </button>
        <PriorityGlyph priority={task.priority} className="shrink-0" />
      </div>

      <div className="hidden md:block">
        <StatusPill status={task.status} />
      </div>

      <span className="hidden text-xs leading-4 text-muted tabular sm:block">
        {task.dueDate ? formatDueDate(task.dueDate, timeZone, now) : "—"}
      </span>

      <div className="flex justify-end">
        <SlaBadge task={task} />
      </div>

      <div className="flex justify-end">
        <TaskMenu task={task} onEdit={onEdit} />
      </div>
    </div>
  );
}
