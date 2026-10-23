import type { TaskDTO } from "@taskflow/shared";
import type { TaskDocument } from "../models/Task";

export function toTaskDTO(task: TaskDocument): TaskDTO {
  return {
    id: String(task._id),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    priorityRank: task.priorityRank,
    tags: task.tags,
    position: task.position,
    slaHours: task.slaHours,
    slaCustom: task.slaCustom,
    slaDueAt: task.slaDueAt.toISOString(),
    slaAtRiskAt: task.slaAtRiskAt.toISOString(),
    dueDate: task.dueDate,
    startedAt: task.startedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    statusHistory: task.statusHistory.map((entry) => ({
      from: entry.from,
      to: entry.to,
      at: entry.at.toISOString(),
    })),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    deletedAt: task.deletedAt?.toISOString() ?? null,
  };
}
