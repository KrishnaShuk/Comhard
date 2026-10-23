import type {
  Priority,
  SlaState,
  SortOption,
  Status,
} from "@taskflow/shared";

export interface TaskFilters {
  q: string;
  priority: Priority | "all";
  sla: SlaState | "all";
  status: Status | "all";
  sort: SortOption;
}

export const defaultTaskFilters: TaskFilters = {
  q: "",
  priority: "all",
  sla: "all",
  status: "all",
  sort: "newest",
};

export interface TaskQueryOptions {
  page?: number;
  pageSize?: number;
  archived?: boolean;
  includeStatus?: boolean;
  timeZone?: string;
}

export function buildTaskSearch(
  filters: TaskFilters,
  options: TaskQueryOptions = {},
): string {
  const params = new URLSearchParams();

  params.set("page", String(options.page ?? 1));
  params.set("pageSize", String(options.pageSize ?? 100));
  params.set("sort", filters.sort);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.sla !== "all") params.set("sla", filters.sla);
  if (options.includeStatus && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (options.archived) params.set("archived", "true");
  if (options.timeZone) params.set("tz", options.timeZone);

  return params.toString();
}
