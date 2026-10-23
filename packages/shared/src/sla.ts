import { SLA_AT_RISK_RATIO } from "./constants";
import type { SlaState } from "./constants";
import type { ComplianceResult, SlaTiming } from "./types";
import { SLA_TARGET } from "./constants";

const HOUR_MS = 60 * 60 * 1000;

function toTime(value: string | Date | number): number {
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
}

export function getSlaWindow(
  createdAt: Date,
  slaHours: number,
): { slaDueAt: Date; slaAtRiskAt: Date } {
  const base = createdAt.getTime();
  return {
    slaAtRiskAt: new Date(base + slaHours * SLA_AT_RISK_RATIO * HOUR_MS),
    slaDueAt: new Date(base + slaHours * HOUR_MS),
  };
}

export function getSlaState(
  task: SlaTiming,
  now: Date | string | number = new Date(),
): SlaState {
  const due = toTime(task.slaDueAt);
  const nowTime = toTime(now);

  if (task.completedAt) {
    return toTime(task.completedAt) <= due ? "met" : "breached";
  }

  if (nowTime >= due) return "breached";
  if (nowTime >= toTime(task.slaAtRiskAt)) return "at_risk";
  return "on_track";
}

export function formatDurationShort(milliseconds: number): string {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const ms = Math.max(0, Math.round(milliseconds));

  if (ms < minute) return "<1m";

  const totalMinutes = Math.floor(ms / minute);
  if (totalMinutes < 60) return `${totalMinutes}m`;

  const totalHours = Math.floor(ms / hour);
  if (totalHours < 24) {
    const minutes = totalMinutes % 60;
    return minutes === 0 ? `${totalHours}h` : `${totalHours}h ${minutes}m`;
  }

  const days = Math.floor(ms / day);
  const hours = Math.floor((ms % day) / hour);
  return hours === 0 ? `${days}d` : `${days}d ${hours}h`;
}

export function formatSlaSummary(
  task: SlaTiming,
  state: SlaState,
  now: Date | string | number = new Date(),
): string {
  const due = toTime(task.slaDueAt);

  if (state === "met") {
    const early = due - toTime(task.completedAt ?? now);
    return early < 60 * 1000 ? "Met on time" : `Met, ${formatDurationShort(early)} early`;
  }

  if (state === "breached") {
    if (task.completedAt) {
      const late = toTime(task.completedAt) - due;
      return late < 60 * 1000
        ? "Breached on time"
        : `Breached, ${formatDurationShort(late)} late`;
    }
    return `${formatDurationShort(toTime(now) - due)} overdue`;
  }

  return `${formatDurationShort(due - toTime(now))} left`;
}

export function complianceOf(
  states: readonly SlaState[],
): ComplianceResult {
  let met = 0;
  let breached = 0;

  for (const state of states) {
    if (state === "met") met += 1;
    if (state === "breached") breached += 1;
  }

  const denominator = met + breached;
  return {
    met,
    breached,
    denominator,
    rate: denominator === 0 ? null : met / denominator,
    target: SLA_TARGET,
  };
}
