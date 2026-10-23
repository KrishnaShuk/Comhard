import { STATUS_LABELS, type Status } from "@taskflow/shared";
import { cn } from "@/lib/cn";

const classByStatus: Record<Status, string> = {
  todo: "pill-todo",
  in_progress: "pill-in-progress",
  done: "pill-done",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={cn("pill", classByStatus[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}
