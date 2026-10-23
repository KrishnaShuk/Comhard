import type { Priority, Status } from "./constants";

export interface StatusHistoryEntry {
  from: Status | null;
  to: Status;
  at: string;
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  priorityRank: number;
  tags: string[];
  position: number;
  slaHours: number;
  slaCustom: boolean;
  slaDueAt: string;
  slaAtRiskAt: string;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface ComplianceResult {
  met: number;
  breached: number;
  denominator: number;
  rate: number | null;
  target: number;
}

export interface ComplianceBucket extends ComplianceResult {
  date: string;
}

export interface ComplianceReport {
  from: string;
  to: string;
  timeZone: string;
  target: number;
  total: ComplianceResult;
  buckets: ComplianceBucket[];
}

export interface SlaTiming {
  completedAt: string | null;
  slaDueAt: string;
  slaAtRiskAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}
