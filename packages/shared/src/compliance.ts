import { SLA_TARGET } from "./constants";
import { eachDateKey, getDateKeyInTz } from "./dates";
import { complianceOf, getSlaState } from "./sla";
import type {
  ComplianceReport,
  SlaTiming,
  StatusHistoryEntry,
  ComplianceBucket,
} from "./types";

export interface ComplianceTask extends SlaTiming {
  createdAt: string;
}

export function buildComplianceReport(
  tasks: readonly ComplianceTask[],
  from: string,
  to: string,
  timeZone: string,
  now: Date = new Date(),
): ComplianceReport {
  const dateKeys = eachDateKey(from, to);
  const grouped = new Map<string, ComplianceTask[]>(dateKeys.map((key) => [key, []]));

  for (const task of tasks) {
    const key = getDateKeyInTz(task.createdAt, timeZone);
    grouped.get(key)?.push(task);
  }

  const buckets: ComplianceBucket[] = dateKeys.map((date) => ({
    date,
    ...complianceOf(
      (grouped.get(date) ?? []).map((task) => getSlaState(task, now)),
    ),
  }));

  return {
    from,
    to,
    timeZone,
    target: SLA_TARGET,
    total: complianceOf(tasks.map((task) => getSlaState(task, now))),
    buckets,
  };
}

export function taskCreatedEntry(
  status: "todo",
  createdAt: string,
): StatusHistoryEntry {
  return { from: null, to: status, at: createdAt };
}
