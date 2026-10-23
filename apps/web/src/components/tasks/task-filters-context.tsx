"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultTaskFilters,
  type TaskFilters,
} from "@/lib/task-query";

interface TaskFiltersContextValue {
  filters: TaskFilters;
  setFilters: (patch: Partial<TaskFilters>) => void;
  resetFilters: () => void;
}

const TaskFiltersContext = createContext<TaskFiltersContextValue | null>(null);

export function TaskFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setState] = useState<TaskFilters>(defaultTaskFilters);

  const setFilters = useCallback((patch: Partial<TaskFilters>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(defaultTaskFilters);
  }, []);

  const value = useMemo(
    () => ({ filters, setFilters, resetFilters }),
    [filters, setFilters, resetFilters],
  );

  return (
    <TaskFiltersContext.Provider value={value}>
      {children}
    </TaskFiltersContext.Provider>
  );
}

export function useTaskFilters(): TaskFiltersContextValue {
  const context = useContext(TaskFiltersContext);
  if (!context) {
    throw new Error("useTaskFilters must be used inside TaskFiltersProvider");
  }
  return context;
}
