"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { TaskDTO } from "@taskflow/shared";
import { useTimeZone } from "@/hooks/use-time-zone";
import { useTasks } from "@/lib/tasks";
import { useTaskFilters } from "./task-filters-context";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { pluralize } from "@/lib/format";
import { TaskFiltersBar } from "./task-filters-bar";
import { TaskList } from "./task-list";
import { TaskDrawer } from "./task-drawer";
import { QueryError } from "./query-error";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;

export function ListView() {
  const { filters } = useTaskFilters();
  const timeZone = useTimeZone();
  const [page, setPage] = useState(1);
  const tasksQuery = useTasks(filters, {
    page,
    pageSize: PAGE_SIZE,
    includeStatus: true,
    timeZone,
  });
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  const { q, priority, sla, status, sort } = filters;
  useEffect(() => {
    setPage(1);
  }, [q, priority, sla, status, sort]);

  const tasks = tasksQuery.data?.data ?? [];
  const total = tasksQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
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
        title="List"
        description={tasksQuery.data ? pluralize(total, "task") : "Loading tasks"}
        actions={
          <Button onClick={createTask}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New task
          </Button>
        }
      />

      <div className="mt-5">
        <TaskFiltersBar showStatus showSort />
      </div>

      <div className="mt-5">
        {tasksQuery.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : null}
        {tasksQuery.isError ? (
          <QueryError error={tasksQuery.error} retry={() => void tasksQuery.refetch()} />
        ) : null}
        {tasksQuery.data && tasks.length > 0 ? (
          <TaskList tasks={tasks} onEdit={editTask} />
        ) : null}
        {tasksQuery.data && tasks.length === 0 ? (
          <EmptyState
            title="No tasks match these filters"
            description="Try clearing filters or create a new task."
          />
        ) : null}
      </div>

      {tasksQuery.data && total > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted tabular">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

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
