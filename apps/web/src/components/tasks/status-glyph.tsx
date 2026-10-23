import { Check } from "lucide-react";
import { STATUS_LABELS, type Status } from "@taskflow/shared";
import { cn } from "@/lib/cn";

const colorClass: Record<Status, string> = {
  todo: "text-muted",
  in_progress: "text-[var(--status-progress)]",
  done: "text-[var(--status-done)]",
};

export function StatusGlyph({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`Status: ${STATUS_LABELS[status]}`}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px]",
        colorClass[status],
        className,
      )}
    >
      {status === "in_progress" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
      {status === "done" ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
    </span>
  );
}
