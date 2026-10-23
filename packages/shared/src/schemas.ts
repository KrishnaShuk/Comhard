import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PRIORITIES,
  SLA_STATES,
  SORT_OPTIONS,
  STATUSES,
} from "./constants";
import { isDateKey, isValidTimeZone } from "./dates";

export const calendarDateSchema = z
  .string()
  .refine(isDateKey, "Use a calendar date in YYYY-MM-DD format");

export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200);

export const taskDescriptionSchema = z.string().trim().max(2000);

export const taskSlaHoursSchema = z.number().finite().min(0.25).max(8760);

const dateKey = calendarDateSchema;

const timeZone = z.preprocess(
  (value) => (value === undefined ? "UTC" : value),
  z.string().min(1).max(100).refine(isValidTimeZone, "Unknown time zone"),
);

function enumList<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(
    (value) => (typeof value === "string" ? [value] : value),
    z.array(z.enum(values)).min(1).max(values.length),
  );
}

function positiveInt(fallback: number, max: number) {
  return z.preprocess(
    (value) => (value === undefined ? String(fallback) : value),
    z
      .string()
      .regex(/^\d+$/, "Must be a whole number")
      .transform(Number)
      .pipe(z.number().int().min(1).max(max)),
  );
}

const booleanString = z.preprocess(
  (value) => (value === undefined ? "false" : value),
  z.enum(["true", "false"]).transform((value) => value === "true"),
);

const optionalSearch = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(100).optional(),
);

const rangeRefinement = <T extends { from?: string; to?: string }>(
  value: T,
  ctx: z.RefinementCtx,
) => {
  if (value.from && value.to && value.from > value.to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: "End date must be on or after the start date",
    });
  }
};

export const taskListQuerySchema = z
  .object({
    page: positiveInt(1, 100000),
    pageSize: positiveInt(DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    status: enumList(STATUSES).optional(),
    priority: enumList(PRIORITIES).optional(),
    sla: enumList(SLA_STATES).optional(),
    q: optionalSearch,
    sort: z.enum(SORT_OPTIONS).optional(),
    archived: booleanString,
    from: dateKey.optional(),
    to: dateKey.optional(),
    tz: timeZone,
  })
  .strict()
  .superRefine(rangeRefinement);

export type TaskListQuery = z.infer<typeof taskListQuerySchema>;

export const createTaskSchema = z
  .object({
    title: taskTitleSchema,
    description: taskDescriptionSchema.optional(),
    priority: z.enum(PRIORITIES).default("medium"),
    slaHours: taskSlaHoursSchema.optional(),
    dueDate: dateKey.nullable().optional(),
  })
  .strict();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title: taskTitleSchema.optional(),
    description: taskDescriptionSchema.optional(),
    priority: z.enum(PRIORITIES).optional(),
    slaHours: taskSlaHoursSchema.optional(),
    dueDate: dateKey.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const transitionTaskSchema = z
  .object({
    to: z.enum(STATUSES),
  })
  .strict();

export type TransitionTaskInput = z.infer<typeof transitionTaskSchema>;

export const complianceQuerySchema = z
  .object({
    from: dateKey.optional(),
    to: dateKey.optional(),
    tz: timeZone,
  })
  .strict()
  .superRefine(rangeRefinement);

export type ComplianceQuery = z.infer<typeof complianceQuerySchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
    password: z
      .string()
      .min(10, "Use at least 10 characters")
      .max(200),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
    password: z.string().min(1, "Password is required").max(200),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
