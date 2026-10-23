"use client";

import type { TaskDTO } from "@taskflow/shared";
import { TaskRow } from "./task-row";

export function TaskList({
  tasks,
  onEdit,
}: {
  tasks: TaskDTO[];
  onEdit: (task: TaskDTO) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div
        aria-hidden="true"
        className="grid h-8 grid-cols-[minmax(0,1fr)_auto_32px] items-center gap-3 border-b border-border bg-background px-3 text-xs font-medium text-muted sm:grid-cols-[minmax(0,1fr)_92px_140px_32px] md:grid-cols-[minmax(0,1fr)_128px_92px_140px_32px]"
      >
        <span>Task</span>
        <span className="hidden md:block">Status</span>
        <span className="hidden sm:block">Due</span>
        <span className="text-right">SLA</span>
        <span />
      </div>
      <div role="list" aria-label="Tasks">
        {tasks.map((task) => (
          <div role="listitem" key={task.id}>
            <TaskRow task={task} onEdit={onEdit} />
          </div>
        ))}
      </div>
    </div>
  );
}
