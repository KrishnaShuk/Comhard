import { Router } from "express";
import type { FilterQuery } from "mongoose";
import {
  ERROR_CODES,
  PRIORITY_RANK,
  SLA_HOURS,
  addDaysToDateKey,
  canTransition,
  createTaskSchema,
  getSlaState,
  getSlaWindow,
  taskListQuerySchema,
  transitionTaskSchema,
  updateTaskSchema,
  zonedStartOfDay,
  type Paginated,
  type TaskDTO,
} from "@taskflow/shared";
import { HttpError, notFound } from "../errors";
import { asyncHandler } from "../lib/async-handler";
import { parse } from "../lib/parse";
import { currentUserId } from "../middleware/auth";
import { toTaskDTO } from "../lib/task-mapper";
import { TaskModel, type TaskFields } from "../models/Task";

export const tasksRouter = Router();

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compareTasks(a: TaskDTO, b: TaskDTO, sort: string): number {
  if (sort === "oldest") return Date.parse(a.createdAt) - Date.parse(b.createdAt);
  if (sort === "priority") {
    return a.priorityRank - b.priorityRank || Date.parse(b.createdAt) - Date.parse(a.createdAt);
  }
  if (sort === "due") {
    const left = a.dueDate ?? "9999-12-31";
    const right = b.dueDate ?? "9999-12-31";
    return left.localeCompare(right) || a.priorityRank - b.priorityRank;
  }
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

tasksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const query = parse(taskListQuerySchema, req.query);
    const filter: FilterQuery<TaskFields> = {
      userId,
      deletedAt: query.archived ? { $ne: null } : null,
    };

    if (query.status) filter.status = { $in: query.status };
    if (query.priority) filter.priority = { $in: query.priority };

    if (query.q) {
      const search = new RegExp(escapeRegex(query.q), "i");
      filter.$or = [{ title: search }, { description: search }];
    }

    if (query.from || query.to) {
      filter.createdAt = {
        ...(query.from ? { $gte: zonedStartOfDay(query.from, query.tz) } : {}),
        ...(query.to
          ? { $lt: zonedStartOfDay(addDaysToDateKey(query.to, 1), query.tz) }
          : {}),
      };
    }

    const documents = await TaskModel.find(filter).sort({ createdAt: -1 });
    const now = new Date();
    let tasks = documents.map(toTaskDTO);

    if (query.sla) {
      const states = new Set(query.sla);
      tasks = tasks.filter((task) => states.has(getSlaState(task, now)));
    }

    tasks.sort((a, b) => compareTasks(a, b, query.sort ?? "newest"));

    const total = tasks.length;
    const start = (query.page - 1) * query.pageSize;
    const body: Paginated<TaskDTO> = {
      data: tasks.slice(start, start + query.pageSize),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };

    res.json(body);
  }),
);

tasksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const input = parse(createTaskSchema, req.body);
    const now = new Date();
    const slaHours = input.slaHours ?? SLA_HOURS[input.priority];
    const window = getSlaWindow(now, slaHours);

    const task = await TaskModel.create({
      userId,
      title: input.title,
      description: input.description ?? "",
      status: "todo",
      priority: input.priority,
      priorityRank: PRIORITY_RANK[input.priority],
      slaHours,
      slaCustom: input.slaHours !== undefined,
      slaDueAt: window.slaDueAt,
      slaAtRiskAt: window.slaAtRiskAt,
      dueDate: input.dueDate ?? null,
      startedAt: null,
      completedAt: null,
      statusHistory: [{ from: null, to: "todo", at: now }],
      deletedAt: null,
    });

    res.status(201).json({ data: toTaskDTO(task) });
  }),
);

tasksRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const task = await TaskModel.findOne({
      _id: req.params.id,
      userId,
      deletedAt: null,
    });

    if (!task) throw notFound();
    res.json({ data: toTaskDTO(task) });
  }),
);

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const input = parse(updateTaskSchema, req.body);
    const task = await TaskModel.findOne({
      _id: req.params.id,
      userId,
      deletedAt: null,
    });

    if (!task) throw notFound();

    if (
      task.status === "done" &&
      (input.priority !== undefined || input.slaHours !== undefined)
    ) {
      throw new HttpError(
        409,
        ERROR_CODES.TASK_COMPLETED_LOCKED,
        "Completed tasks are locked for priority and SLA",
        {
          ...(input.priority !== undefined ? { priority: "Reopen the task to change priority" } : {}),
          ...(input.slaHours !== undefined ? { slaHours: "Reopen the task to change SLA" } : {}),
        },
      );
    }

    if (input.title !== undefined) task.title = input.title;
    if (input.description !== undefined) task.description = input.description;
    if (input.dueDate !== undefined) task.dueDate = input.dueDate;

    let slaHours = task.slaHours;
    let slaCustom = task.slaCustom;
    let recomputeWindow = false;

    if (input.slaHours !== undefined) {
      slaHours = input.slaHours;
      slaCustom = true;
      recomputeWindow = true;
    }

    if (input.priority !== undefined && input.priority !== task.priority) {
      task.priority = input.priority;
      task.priorityRank = PRIORITY_RANK[input.priority];

      if (!slaCustom) {
        slaHours = SLA_HOURS[input.priority];
        recomputeWindow = true;
      }
    }

    if (recomputeWindow) {
      const window = getSlaWindow(task.createdAt, slaHours);
      task.slaHours = slaHours;
      task.slaDueAt = window.slaDueAt;
      task.slaAtRiskAt = window.slaAtRiskAt;
    }

    task.slaCustom = slaCustom;
    await task.save();
    res.json({ data: toTaskDTO(task) });
  }),
);

tasksRouter.post(
  "/:id/transition",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const input = parse(transitionTaskSchema, req.body);
    const task = await TaskModel.findOne({
      _id: req.params.id,
      userId,
      deletedAt: null,
    });

    if (!task) throw notFound();

    if (!canTransition(task.status, input.to)) {
      throw new HttpError(
        409,
        ERROR_CODES.TASK_TRANSITION_BLOCKED,
        `Cannot move a task from ${task.status} to ${input.to}`,
      );
    }

    const now = new Date();
    const from = task.status;

    if (input.to === "in_progress") {
      task.startedAt = task.startedAt ?? now;
      task.completedAt = null;
    } else if (input.to === "done") {
      task.completedAt = now;
    } else {
      task.completedAt = null;
    }

    task.status = input.to;
    task.statusHistory.push({ from, to: input.to, at: now });
    await task.save();

    res.json({ data: toTaskDTO(task) });
  }),
);

tasksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const task = await TaskModel.findOne({
      _id: req.params.id,
      userId,
      deletedAt: null,
    });

    if (!task) throw notFound();

    task.deletedAt = new Date();
    await task.save();
    res.json({ data: toTaskDTO(task) });
  }),
);

tasksRouter.post(
  "/:id/restore",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const task = await TaskModel.findOne({
      _id: req.params.id,
      userId,
      deletedAt: { $ne: null },
    });

    if (!task) throw notFound("Archived task not found");

    task.deletedAt = null;
    await task.save();
    res.json({ data: toTaskDTO(task) });
  }),
);
