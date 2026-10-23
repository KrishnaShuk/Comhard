"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  STATUSES,
  STATUS_LABELS,
  canTransition,
  type Status,
  type TaskDTO,
} from "@taskflow/shared";
import { cn } from "@/lib/cn";
import { useTaskActions } from "@/lib/tasks";
import { StatusGlyph } from "./status-glyph";
import { TaskCard, TaskCardPreview } from "./task-card";

const columns: Status[] = [...STATUSES];

function sortForBoard(tasks: TaskDTO[]): TaskDTO[] {
  return [...tasks].sort(
    (a, b) =>
      a.priorityRank - b.priorityRank ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

function BoardColumn({
  status,
  tasks,
  activeStatus,
  onEdit,
}: {
  status: Status;
  tasks: TaskDTO[];
  activeStatus: Status | null;
  onEdit: (task: TaskDTO) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const validTarget = activeStatus ? canTransition(activeStatus, status) : false;
  const highlighted = Boolean(isOver && validTarget);

  return (
    <section
      ref={setNodeRef}
      aria-label={`${STATUS_LABELS[status]} column`}
      className={cn(
        "flex min-h-[240px] flex-col rounded-lg border border-transparent transition-colors duration-100",
        highlighted && "border-accent bg-accent-tint/50",
      )}
    >
      <header className="flex h-10 items-center gap-2 px-1">
        <StatusGlyph status={status} />
        <h2 className="text-sm font-medium leading-5">{STATUS_LABELS[status]}</h2>
        <span className="text-xs leading-4 text-muted tabular">{tasks.length}</span>
      </header>

      <div className="flex flex-1 flex-col gap-2 p-1">
        {tasks.map((task) => (
          <div key={`${task.id}-${task.status}`} className="task-drop-settle">
            <TaskCard task={task} onEdit={onEdit} />
          </div>
        ))}

        {tasks.length === 0 ? (
          <div
            className={cn(
              "flex h-20 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted",
              highlighted && "border-accent text-accent-tint-text",
            )}
          >
            {highlighted ? "Drop here" : "No tasks"}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function Board({
  tasks,
  onEdit,
}: {
  tasks: TaskDTO[];
  onEdit: (task: TaskDTO) => void;
}) {
  const actions = useTaskActions();
  const [activeTask, setActiveTask] = useState<TaskDTO | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent): void {
    const task = tasks.find((item) => item.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent): void {
    const task = activeTask;
    setActiveTask(null);

    if (!task || !event.over) return;
    const target = String(event.over.id);
    if (!STATUSES.includes(target as Status)) return;

    const to = target as Status;
    if (!canTransition(task.status, to)) return;
    actions.move(task, to);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            activeStatus={activeTask?.status ?? null}
            tasks={sortForBoard(tasks.filter((task) => task.status === status))}
            onEdit={onEdit}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{ duration: 160, easing: "cubic-bezier(0.2, 0, 0, 1)" }}
      >
        {activeTask ? <TaskCardPreview task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
