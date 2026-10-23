"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  STATUSES,
  STATUS_LABELS,
  type Status,
  type TaskDTO,
} from "@taskflow/shared";
import { useTimeZone } from "@/hooks/use-time-zone";
import { useTasks } from "@/lib/tasks";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaskFilters } from "./task-filters-context";
import { TaskFiltersBar } from "./task-filters-bar";
import { TaskRow } from "./task-row";
import { TaskDrawer } from "./task-drawer";
import { QueryError } from "./query-error";
import { StatusGlyph } from "./status-glyph";

const sections: Status[] = [...STATUSES];

function sortTasks(tasks: TaskDTO[]): TaskDTO[] {
  return [...tasks].sort(
    (a, b) =>
      a.priorityRank - b.priorityRank ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function SectionsView() {
  const { filters } = useTaskFilters();
  const timeZone = useTimeZone();
  const tasksQuery = useTasks(filters, { pageSize: 100, timeZone });
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  const tasks = tasksQuery.data?.data ?? [];
  const liveSelected = selectedTask
    ? tasks.find((task) => task.id === selectedTask.id) ?? selectedTask
    : null;

  function editTask(task: TaskDTO): void {
    setSelectedTask(task);
    setOpen(true);
  }

  function createTask(): void {
    setSelectedTask(null);
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Sections"
        description={
          tasksQuery.data ? pluralize(tasksQuery.data.total, "task") : "Loading tasks"
        }
        actions={
          <Button onClick={createTask}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New task
          </Button>
        }
      />

      <div className="mt-5">
        <TaskFiltersBar />
      </div>

      <div className="mt-5 space-y-6">
        {tasksQuery.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : null}

        {tasksQuery.isError ? (
          <QueryError error={tasksQuery.error} retry={() => void tasksQuery.refetch()} />
        ) : null}

        {tasksQuery.data && tasks.length === 0 ? (
          <EmptyState
            title="No tasks match these filters"
            description="Try clearing filters or create a new task."
          />
        ) : null}

        {tasksQuery.data && tasks.length > 0
          ? sections.map((status) => {
              const sectionTasks = sortTasks(
                tasks.filter((task) => task.status === status),
              );

              return (
                <section key={status} aria-labelledby={`section-${status}`}>
                  <div className="flex h-8 items-center gap-2 px-1">
                    <StatusGlyph status={status} />
                    <h2
                      id={`section-${status}`}
                      className="text-sm font-medium leading-5"
                    >
                      {STATUS_LABELS[status]}
                    </h2>
                    <span className="text-xs leading-4 text-muted tabular">
                      {sectionTasks.length}
                    </span>
                  </div>

                  {sectionTasks.length > 0 ? (
                    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface")}>
                      <div role="list" aria-label={`${STATUS_LABELS[status]} tasks`}>
                        {sectionTasks.map((task) => (
                          <div role="listitem" key={task.id}>
                            <TaskRow task={task} onEdit={editTask} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-12 items-center rounded-lg border border-dashed border-border px-3 text-xs text-muted">
                      No tasks in {STATUS_LABELS[status].toLowerCase()}
                    </div>
                  )}
                </section>
              );
            })
          : null}
      </div>

      <TaskDrawer
        key={selectedTask?.id ?? "new"}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSelectedTask(null);
        }}
        task={liveSelected}
        onArchived={() => {
          setOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}
