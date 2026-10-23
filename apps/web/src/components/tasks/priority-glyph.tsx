import { PRIORITY_LABELS, type Priority } from "@taskflow/shared";
import { cn } from "@/lib/cn";

const bars: Record<Exclude<Priority, "urgent">, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const heights = ["h-1.5", "h-2.5", "h-3.5"];

export function PriorityGlyph({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  if (priority === "urgent") {
    return (
      <span
        role="img"
        aria-label={`Priority: ${PRIORITY_LABELS[priority]}`}
        className={cn(
          "inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] bg-foreground text-[10px] font-bold leading-none text-background",
          className,
        )}
      >
        !
      </span>
    );
  }

  const filled = bars[priority];

  return (
    <span
      role="img"
      aria-label={`Priority: ${PRIORITY_LABELS[priority]}`}
      className={cn("inline-flex shrink-0 items-end gap-[2px]", className)}
    >
      {heights.map((height, index) => (
        <span
          key={height}
          className={cn(
            "w-[2px] rounded-[1px]",
            height,
            index < filled ? "bg-foreground" : "bg-foreground/25",
          )}
        />
      ))}
    </span>
  );
}
