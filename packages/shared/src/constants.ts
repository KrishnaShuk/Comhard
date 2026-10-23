export const STATUSES = ["todo", "in_progress", "done"] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["urgent", "high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const SLA_HOURS: Record<Priority, number> = {
  urgent: 4,
  high: 24,
  medium: 72,
  low: 168,
};

export const SLA_AT_RISK_RATIO = 0.75;
export const SLA_TARGET = 0.9;

export const SLA_STATES = ["on_track", "at_risk", "breached", "met"] as const;
export type SlaState = (typeof SLA_STATES)[number];

export const ALLOWED_TRANSITIONS: Record<Status, readonly Status[]> = {
  todo: ["in_progress"],
  in_progress: ["todo", "done"],
  done: ["in_progress"],
};

export const STATUS_LABELS: Record<Status, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const SLA_LABELS: Record<SlaState, string> = {
  on_track: "On track",
  at_risk: "At risk",
  breached: "Breached",
  met: "Met",
};

export const SORT_OPTIONS = ["newest", "oldest", "priority", "due"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_RANGE_DAYS = 366;
