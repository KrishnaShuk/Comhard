import { z } from "zod";
import {
  PRIORITIES,
  calendarDateSchema,
  taskDescriptionSchema,
  taskSlaHoursSchema,
  taskTitleSchema,
} from "@taskflow/shared";

export const taskFormSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
  priority: z.enum(PRIORITIES),
  slaHours: taskSlaHoursSchema,
  dueDate: z.union([calendarDateSchema, z.literal("")]),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
