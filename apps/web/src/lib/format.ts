import { addDaysToDateKey, getTodayInTz } from "@taskflow/shared";

export function formatDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

export function formatDueDate(
  dateKey: string,
  timeZone: string,
  now: Date,
): string {
  const today = getTodayInTz(timeZone, now);
  if (dateKey === today) return "Today";
  if (dateKey === addDaysToDateKey(today, 1)) return "Tomorrow";
  if (dateKey === addDaysToDateKey(today, -1)) return "Yesterday";
  return formatDateKey(dateKey);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatPercent(rate: number | null): string {
  if (rate === null) return "No data";
  return `${Math.round(rate * 100)}%`;
}

export function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}
