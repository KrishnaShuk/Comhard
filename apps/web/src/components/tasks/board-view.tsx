"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { TaskDTO } from "@taskflow/shared";
import { useTimeZone } from "@/hooks/use-time-zone";
import { useTasks } from "@/lib/tasks";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { pluralize } from "@/lib/format";
import { useTaskFilters } from "./task-filters-context";
import { TaskFiltersBar } from "./task-filters-bar";
import { BoardSkeleton } from "./board-skeleton";
import { QueryError } from "./query-error";
import { Board } from "./board";
import { TaskDrawer } from "./task-drawer";

export function BoardView() {
  const { filters } = useTaskFilters();
  const timeZone = useTimeZone();
  const tasksQuery = useTasks(filters, { pageSize: 100, timeZone });
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  const tasks = tasksQuery.data?.data ?? [];
  const liveSelected = selectedTask
    ? tasks.find((task) => task.id === selectedTask.id) ?? selectedTask
    : null;
  const openCount = tasks.filter((task) => task.status !== "done").length;

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
        title="Board"
        description={
          tasksQuery.data
            ? `${pluralize(tasksQuery.data.total, "task")} · ${openCount} open`
            : "Loading tasks"
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

      <div className="mt-5">
        {tasksQuery.isPending ? <BoardSkeleton /> : null}
        {tasksQuery.isError ? (
          <QueryError error={tasksQuery.error} retry={() => void tasksQuery.refetch()} />
        ) : null}
        {tasksQuery.data ? <Board tasks={tasks} onEdit={editTask} /> : null}
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
