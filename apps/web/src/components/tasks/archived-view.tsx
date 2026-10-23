"use client";

import { RotateCcw } from "lucide-react";
import { useTimeZone } from "@/hooks/use-time-zone";
import { useTasks, useTaskActions } from "@/lib/tasks";
import { useTaskFilters } from "./task-filters-context";
import { PageHeader } from "@/components/page-header";
import { pluralize, formatDateTime } from "@/lib/format";
import { TaskFiltersBar } from "./task-filters-bar";
import { StatusGlyph } from "./status-glyph";
import { StatusPill } from "./status-pill";
import { PriorityGlyph } from "./priority-glyph";
import { SlaBadge } from "./sla-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "./query-error";

export function ArchivedView() {
  const { filters } = useTaskFilters();
  const timeZone = useTimeZone();
  const tasksQuery = useTasks(filters, {
    pageSize: 100,
    archived: true,
    timeZone,
  });
  const actions = useTaskActions();

  const tasks = tasksQuery.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Archived"
        description={
          tasksQuery.data ? pluralize(tasksQuery.data.total, "task") : "Loading tasks"
        }
      />

      <div className="mt-5">
        <TaskFiltersBar />
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
          <QueryError
            error={tasksQuery.error}
            retry={() => void tasksQuery.refetch()}
          />
        ) : null}

        {tasksQuery.data && tasks.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div
              aria-hidden="true"
              className="grid h-8 grid-cols-[minmax(0,1fr)_120px_32px] items-center gap-3 border-b border-border bg-background px-3 text-xs font-medium text-muted md:grid-cols-[minmax(0,1fr)_128px_140px_120px_96px]"
            >
              <span>Task</span>
              <span className="hidden md:block">Status</span>
              <span className="text-right">SLA</span>
              <span className="hidden md:block">Archived</span>
              <span />
            </div>
            <div role="list" aria-label="Archived tasks">
              {tasks.map((task) => (
                <div
                  role="listitem"
                  key={task.id}
                  className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-border px-3 transition-colors duration-100 last:border-b-0 hover:bg-accent-tint/40 md:grid-cols-[minmax(0,1fr)_128px_140px_120px_96px]"
                >
                  <div className="flex min-w-0 items-center gap-2 py-2">
                    <StatusGlyph status={task.status} />
                    <span className="min-w-0 truncate text-sm leading-5">
                      {task.title}
                    </span>
                    <PriorityGlyph priority={task.priority} className="shrink-0" />
                  </div>
                  <div className="hidden md:block">
                    <StatusPill status={task.status} />
                  </div>
                  <div className="flex justify-end">
                    <SlaBadge task={task} />
                  </div>
                  <span className="hidden text-xs leading-4 text-muted tabular md:block">
                    {task.deletedAt ? formatDateTime(task.deletedAt) : ""}
                  </span>
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => actions.restore(task)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {tasksQuery.data && tasks.length === 0 ? (
          <EmptyState
            title="Nothing archived"
            description="Tasks you archive will wait here until you restore them."
          />
        ) : null}
      </div>
    </div>
  );
}
