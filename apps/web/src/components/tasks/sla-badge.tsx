"use client";

import { useEffect, useRef, useState } from "react";
import { AlarmClock, Check, Clock3 } from "lucide-react";
import {
  SLA_LABELS,
  formatSlaSummary,
  getSlaState,
  type SlaTiming,
} from "@taskflow/shared";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/cn";

export function SlaBadge({
  task,
  className,
}: {
  task: SlaTiming;
  className?: string;
}) {
  const now = useNow();
  const state = getSlaState(task, now);
  const label = formatSlaSummary(task, state, now);
  const previous = useRef(state);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (previous.current !== state) {
      setAnnouncement(`SLA state changed to ${SLA_LABELS[state]}`);
      previous.current = state;
    }
  }, [state]);

  const shared = cn("inline-flex items-center gap-1 whitespace-nowrap tabular", className);

  let content: React.ReactNode;

  if (state === "on_track") {
    content = <span className={cn(shared, "sla-ontrack text-xs")}>{label}</span>;
  } else if (state === "at_risk") {
    content = (
      <span className={cn("pill pill-at-risk tabular", className)}>
        <Clock3 aria-hidden="true" className="h-3 w-3" />
        {label}
      </span>
    );
  } else if (state === "met") {
    content = (
      <span className={cn("pill pill-met tabular", className)}>
        <Check aria-hidden="true" className="h-3 w-3" />
        {label}
      </span>
    );
  } else if (!task.completedAt) {
    content = (
      <span className={cn("pill pill-breached tabular", className)}>
        <AlarmClock aria-hidden="true" className="h-3 w-3" />
        {label}
      </span>
    );
  } else {
    content = (
      <span className={cn(shared, "sla-late text-xs")}>
        <AlarmClock aria-hidden="true" className="h-3 w-3" />
        {label}
      </span>
    );
  }

  return (
    <span aria-label={`SLA: ${label}`} suppressHydrationWarning>
      {content}
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </span>
  );
}
