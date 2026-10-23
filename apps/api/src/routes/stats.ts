import { Router } from "express";
import {
  ERROR_CODES,
  MAX_RANGE_DAYS,
  addDaysToDateKey,
  buildComplianceReport,
  complianceQuerySchema,
  getTodayInTz,
  rangeDayCount,
  zonedStartOfDay,
  type ComplianceTask,
} from "@taskflow/shared";
import { HttpError } from "../errors";
import { asyncHandler } from "../lib/async-handler";
import { parse } from "../lib/parse";
import { currentUserId } from "../middleware/auth";
import { TaskModel } from "../models/Task";

export const statsRouter = Router();

statsRouter.get(
  "/compliance",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const query = parse(complianceQuerySchema, req.query);
    const to = query.to ?? getTodayInTz(query.tz);
    const from = query.from ?? addDaysToDateKey(to, -29);

    if (from > to) {
      throw new HttpError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "Check the highlighted fields",
        { to: "End date must be on or after the start date" },
      );
    }

    if (rangeDayCount(from, to) > MAX_RANGE_DAYS) {
      throw new HttpError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "Check the highlighted fields",
        { to: `Choose a range of ${MAX_RANGE_DAYS} days or less` },
      );
    }

    const start = zonedStartOfDay(from, query.tz);
    const end = zonedStartOfDay(addDaysToDateKey(to, 1), query.tz);

    const tasks = await TaskModel.find({
      userId,
      deletedAt: null,
      createdAt: { $gte: start, $lt: end },
    }).select("createdAt completedAt slaDueAt slaAtRiskAt");

    const report = buildComplianceReport(
      tasks.map(
        (task): ComplianceTask => ({
          createdAt: task.createdAt.toISOString(),
          completedAt: task.completedAt?.toISOString() ?? null,
          slaDueAt: task.slaDueAt.toISOString(),
          slaAtRiskAt: task.slaAtRiskAt.toISOString(),
        }),
      ),
      from,
      to,
      query.tz,
      new Date(),
    );

    res.json({ data: report });
  }),
);
