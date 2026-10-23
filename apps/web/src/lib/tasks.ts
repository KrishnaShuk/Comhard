"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  STATUS_LABELS,
  type ComplianceReport,
  type CreateTaskInput,
  type Paginated,
  type Status,
  type TaskDTO,
  type UpdateTaskInput,
} from "@taskflow/shared";
import { toast } from "sonner";
import { ApiError, api } from "./api";
import { queryKeys } from "./query-keys";
import { buildTaskSearch, type TaskFilters, type TaskQueryOptions } from "./task-query";

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export function showError(error: unknown): void {
  toast.error(errorMessage(error), { duration: Infinity });
}

function invalidateTaskData(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  void queryClient.invalidateQueries({ queryKey: ["compliance"] });
}

export function useTasks(filters: TaskFilters, options: TaskQueryOptions = {}) {
  const search = buildTaskSearch(filters, options);

  return useQuery({
    queryKey: queryKeys.tasks(search),
    queryFn: () => api.get<Paginated<TaskDTO>>(`/tasks?${search}`),
    placeholderData: keepPreviousData,
  });
}

export function useCompliance(
  from: string | null,
  to: string | null,
  timeZone: string,
) {
  const search = from && to
    ? new URLSearchParams({ from, to, tz: timeZone }).toString()
    : "";

  return useQuery({
    queryKey: queryKeys.compliance(search),
    queryFn: () =>
      api.get<{ data: ComplianceReport }>(`/stats/compliance?${search}`),
    enabled: Boolean(from && to),
    select: (response) => response.data,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      api.post<{ data: TaskDTO }>("/tasks", input),
    onSuccess: () => {
      invalidateTaskData(queryClient);
      toast.success("Task created");
    },
    onError: showError,
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      api.patch<{ data: TaskDTO }>(`/tasks/${id}`, input),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.task(response.data.id), response);
      invalidateTaskData(queryClient);
      toast.success("Task updated");
    },
    onError: showError,
  });
}

interface TransitionVariables {
  id: string;
  to: Status;
}

export function useTaskActions() {
  const queryClient = useQueryClient();

  const transition = useMutation({
    mutationFn: ({ id, to }: TransitionVariables) =>
      api.post<{ data: TaskDTO }>(`/tasks/${id}/transition`, { to }),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.task(response.data.id), response);
      invalidateTaskData(queryClient);
    },
    onError: showError,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ data: TaskDTO }>(`/tasks/${id}`),
    onSuccess: () => {
      invalidateTaskData(queryClient);
    },
    onError: showError,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{ data: TaskDTO }>(`/tasks/${id}/restore`),
    onSuccess: () => {
      invalidateTaskData(queryClient);
    },
    onError: showError,
  });

  function move(task: TaskDTO, to: Status): void {
    const previous = task.status;

    transition.mutate(
      { id: task.id, to },
      {
        onSuccess: () => {
          toast.success(`Moved to ${STATUS_LABELS[to]}`, {
            duration: 8000,
            action: {
              label: "Undo",
              onClick: () => {
                transition.mutate(
                  { id: task.id, to: previous },
                  {
                    onSuccess: () => toast.success("Move undone"),
                  },
                );
              },
            },
          });
        },
      },
    );
  }

  function archive(task: TaskDTO): void {
    archiveMutation.mutate(task.id, {
      onSuccess: () => {
        toast.success("Task archived", {
          duration: 8000,
          action: {
            label: "Undo",
            onClick: () => {
              restoreMutation.mutate(task.id, {
                onSuccess: () => toast.success("Task restored"),
              });
            },
          },
        });
      },
    });
  }

  function restore(task: TaskDTO): void {
    restoreMutation.mutate(task.id, {
      onSuccess: () => toast.success("Task restored"),
    });
  }

  return {
    move,
    archive,
    restore,
    isMoving: transition.isPending,
    isArchiving: archiveMutation.isPending,
  };
}
