"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  SLA_HOURS,
  STATUS_LABELS,
  allowedTransitions,
  type CreateTaskInput,
  type Priority,
  type TaskDTO,
  type UpdateTaskInput,
} from "@taskflow/shared";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FilterSelect } from "@/components/ui/filter-select";
import { ApiError } from "@/lib/api";
import { formatDateKey, formatDateTime } from "@/lib/format";
import { useCreateTask, useTaskActions, useUpdateTask } from "@/lib/tasks";
import { taskFormSchema, type TaskFormValues } from "@/lib/task-form";
import { transitionLabel } from "@/lib/transitions";

interface TaskDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskDTO | null;
  onArchived: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs leading-4 font-medium text-foreground">
      {message}
    </p>
  );
}

export function TaskDrawer({
  open,
  onOpenChange,
  task,
  onArchived,
}: TaskDrawerProps) {
  const isEditing = task !== null;
  const isDone = task?.status === "done";
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const actions = useTaskActions();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description,
          priority: task.priority,
          slaHours: task.slaHours,
          dueDate: task.dueDate ?? "",
        }
      : {
          title: "",
          description: "",
          priority: "medium",
          slaHours: SLA_HOURS.medium,
          dueDate: "",
        },
  });

  const priority = form.watch("priority");
  const slaDirty = Boolean(form.formState.dirtyFields.slaHours);
  const customSla = Boolean(task?.slaCustom) || slaDirty;
  const busy = createTask.isPending || updateTask.isPending;

  useEffect(() => {
    if (isDone || customSla) return;
    const next = SLA_HOURS[priority];
    if (form.getValues("slaHours") !== next) {
      form.setValue("slaHours", next);
    }
  }, [priority, customSla, isDone, form]);

  function applyServerFields(error: unknown): void {
    if (!(error instanceof ApiError)) return;
    form.setError("root", { type: "server", message: error.message });

    for (const [key, message] of Object.entries(error.fields ?? {})) {
      if (
        key === "title" ||
        key === "description" ||
        key === "priority" ||
        key === "slaHours" ||
        key === "dueDate"
      ) {
        form.setError(key, { type: "server", message });
      }
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    if (task) {
      const input: UpdateTaskInput = {};
      let changed = false;

      if (values.title !== task.title) {
        input.title = values.title;
        changed = true;
      }
      if (values.description !== task.description) {
        input.description = values.description;
        changed = true;
      }
      if (values.priority !== task.priority && !isDone) {
        input.priority = values.priority;
        changed = true;
      }
      if ((values.dueDate || null) !== task.dueDate) {
        input.dueDate = values.dueDate || null;
        changed = true;
      }
      if (
        slaDirty &&
        !isDone &&
        values.slaHours !== task.slaHours
      ) {
        input.slaHours = values.slaHours;
        changed = true;
      }

      if (!changed) {
        toast.message("No changes to save");
        return;
      }

      updateTask.mutate(
        { id: task.id, input },
        {
          onSuccess: () => onOpenChange(false),
          onError: applyServerFields,
        },
      );
      return;
    }

    const input: CreateTaskInput = {
      title: values.title,
      priority: values.priority,
      dueDate: values.dueDate || null,
    };
    if (values.description) input.description = values.description;
    if (slaDirty) input.slaHours = values.slaHours;

    createTask.mutate(input, {
      onSuccess: () => onOpenChange(false),
      onError: applyServerFields,
    });
  });

  const rootError = form.formState.errors.root?.message;
  const moves = task ? allowedTransitions(task.status) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "Task details" : "New task"}</SheetTitle>
          {task ? (
            <p className="mt-1 text-xs leading-4 text-muted tabular">
              {STATUS_LABELS[task.status]} · created {formatDateTime(task.createdAt)}
            </p>
          ) : (
            <p className="mt-1 text-sm leading-5 text-muted">
              Capture the work, then move it when it is ready.
            </p>
          )}
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <SheetBody>
            {rootError ? (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2">
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                />
                <p role="alert" className="text-sm leading-5">
                  {rootError}
                </p>
              </div>
            ) : null}

            {task ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {moves.map((to) => (
                  <Button
                    key={to}
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={actions.isMoving}
                    onClick={() => actions.move(task, to)}
                  >
                    {transitionLabel(task.status, to)}
                  </Button>
                ))}
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  autoFocus
                  maxLength={200}
                  className="mt-1.5"
                  aria-invalid={Boolean(form.formState.errors.title)}
                  {...form.register("title")}
                />
                <FieldError message={form.formState.errors.title?.message} />
              </div>

              <div>
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  maxLength={2000}
                  className="mt-1.5"
                  aria-invalid={Boolean(form.formState.errors.description)}
                  {...form.register("description")}
                />
                <FieldError message={form.formState.errors.description?.message} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm font-medium leading-5">Priority</span>
                  <FilterSelect
                    label="Priority"
                    value={priority}
                    disabled={isDone}
                    onChange={(value) =>
                      form.setValue("priority", value as Priority, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    options={PRIORITIES.map((item) => ({
                      value: item,
                      label: PRIORITY_LABELS[item],
                    }))}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="task-due-date">Due date</Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    className="mt-1.5"
                    aria-invalid={Boolean(form.formState.errors.dueDate)}
                    {...form.register("dueDate")}
                  />
                  <FieldError message={form.formState.errors.dueDate?.message} />
                </div>
              </div>

              <div>
                <Label htmlFor="task-sla-hours">SLA hours</Label>
                <Input
                  id="task-sla-hours"
                  type="number"
                  min={0.25}
                  max={8760}
                  step={0.25}
                  disabled={isDone}
                  className="mt-1.5"
                  aria-invalid={Boolean(form.formState.errors.slaHours)}
                  {...form.register("slaHours", { valueAsNumber: true })}
                />
                <p className="mt-1 text-xs leading-4 text-muted">
                  {isDone
                    ? "Reopen the task to change priority or SLA."
                    : customSla
                      ? "Custom SLA for this task."
                      : `Default for ${PRIORITY_LABELS[priority]}: ${SLA_HOURS[priority]}h. Editing makes it custom.`}
                </p>
                <FieldError message={form.formState.errors.slaHours?.message} />
              </div>
            </div>

            {task ? (
              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-sm font-medium leading-5">Details</h3>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs leading-4">
                  <dt className="text-muted">SLA due</dt>
                  <dd className="tabular">{formatDateTime(task.slaDueAt)}</dd>
                  {task.dueDate ? (
                    <>
                      <dt className="text-muted">Due date</dt>
                      <dd>{formatDateKey(task.dueDate)}</dd>
                    </>
                  ) : null}
                  {task.startedAt ? (
                    <>
                      <dt className="text-muted">Started</dt>
                      <dd className="tabular">{formatDateTime(task.startedAt)}</dd>
                    </>
                  ) : null}
                  {task.completedAt ? (
                    <>
                      <dt className="text-muted">Completed</dt>
                      <dd className="tabular">{formatDateTime(task.completedAt)}</dd>
                    </>
                  ) : null}
                </dl>
              </div>
            ) : null}

            {task && task.statusHistory.length > 0 ? (
              <div className="mt-5 border-t border-border pt-5">
                <h3 className="text-sm font-medium leading-5">Activity</h3>
                <ol className="mt-2 space-y-1.5">
                  {[...task.statusHistory].reverse().map((entry, index) => (
                    <li
                      key={`${entry.at}-${index}`}
                      className="flex items-baseline justify-between gap-3 text-xs leading-4"
                    >
                      <span>
                        {entry.from
                          ? `${STATUS_LABELS[entry.from]} to ${STATUS_LABELS[entry.to]}`
                          : `Created as ${STATUS_LABELS[entry.to]}`}
                      </span>
                      <span className="shrink-0 text-muted tabular">
                        {formatDateTime(entry.at)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </SheetBody>

          <SheetFooter className="flex items-center justify-between gap-3">
            <div>
              {task ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={actions.isArchiving}
                  onClick={() => {
                    actions.archive(task);
                    onArchived();
                  }}
                >
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  Archive
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {isEditing ? "Save changes" : "Create task"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
