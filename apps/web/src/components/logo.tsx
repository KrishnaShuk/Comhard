import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="grid h-6 w-6 grid-cols-3 items-end gap-[2px] rounded-md border border-border bg-surface p-[3px]"
      >
        <span className="h-1.5 w-full rounded-[1px] bg-muted" />
        <span className="h-3 w-full rounded-[1px] bg-foreground" />
        <span className="h-4 w-full rounded-[1px] bg-foreground" />
      </span>
      <span className="text-sm font-semibold leading-5 tracking-tight">
        TaskFlow
      </span>
    </span>
  );
}
