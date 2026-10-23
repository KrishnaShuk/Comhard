"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  SLA_LABELS,
  SLA_STATES,
  STATUSES,
  STATUS_LABELS,
} from "@taskflow/shared";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/filter-select";
import { Button } from "@/components/ui/button";
import { useTaskFilters } from "./task-filters-context";

interface TaskFiltersBarProps {
  showStatus?: boolean;
  showSort?: boolean;
}

export function TaskFiltersBar({
  showStatus = false,
  showSort = false,
}: TaskFiltersBarProps) {
  const { filters, setFilters, resetFilters } = useTaskFilters();
  const [search, setSearch] = useState(filters.q);

  useEffect(() => {
    if (search === filters.q) return;
    const timer = window.setTimeout(() => setFilters({ q: search }), 250);
    return () => window.clearTimeout(timer);
  }, [search, filters.q, setFilters]);

  const hasFilters =
    filters.q !== "" ||
    filters.priority !== "all" ||
    filters.sla !== "all" ||
    filters.status !== "all";

  function clearFilters(): void {
    setSearch("");
    resetFilters();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tasks"
          aria-label="Search tasks"
          className="pl-9"
        />
      </div>

      <FilterSelect
        label="Filter by priority"
        value={filters.priority}
        onChange={(value) =>
          setFilters({ priority: value as typeof filters.priority })
        }
        options={[
          { value: "all", label: "All priorities" },
          ...PRIORITIES.map((priority) => ({
            value: priority,
            label: PRIORITY_LABELS[priority],
          })),
        ]}
        className="w-full sm:w-40"
      />

      <FilterSelect
        label="Filter by SLA state"
        value={filters.sla}
        onChange={(value) => setFilters({ sla: value as typeof filters.sla })}
        options={[
          { value: "all", label: "All SLA states" },
          ...SLA_STATES.map((state) => ({
            value: state,
            label: SLA_LABELS[state],
          })),
        ]}
        className="w-full sm:w-40"
      />

      {showStatus ? (
        <FilterSelect
          label="Filter by status"
          value={filters.status}
          onChange={(value) =>
            setFilters({ status: value as typeof filters.status })
          }
          options={[
            { value: "all", label: "All statuses" },
            ...STATUSES.map((status) => ({
              value: status,
              label: STATUS_LABELS[status],
            })),
          ]}
          className="w-full sm:w-40"
        />
      ) : null}

      {showSort ? (
        <FilterSelect
          label="Sort tasks"
          value={filters.sort}
          onChange={(value) => setFilters({ sort: value as typeof filters.sort })}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "priority", label: "Priority" },
            { value: "due", label: "Due date" },
          ]}
          className="w-full sm:w-40"
        />
      ) : null}

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
