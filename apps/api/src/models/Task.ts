import { Schema, model, Types, type HydratedDocument } from "mongoose";
import { PRIORITIES, STATUSES } from "@taskflow/shared";
import type { Priority, Status } from "@taskflow/shared";

export interface StatusHistoryFields {
  from: Status | null;
  to: Status;
  at: Date;
}

export interface TaskFields {
  userId: Types.ObjectId;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  priorityRank: number;
  tags: string[];
  position: number;
  slaHours: number;
  slaCustom: boolean;
  slaDueAt: Date;
  slaAtRiskAt: Date;
  dueDate: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  statusHistory: StatusHistoryFields[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<StatusHistoryFields>(
  {
    from: {
      type: String,
      enum: [...STATUSES, null],
      default: null,
    },
    to: { type: String, enum: STATUSES, required: true },
    at: { type: Date, required: true },
  },
  { _id: false },
);

const taskSchema = new Schema<TaskFields>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    status: { type: String, enum: STATUSES, required: true, default: "todo" },
    priority: { type: String, enum: PRIORITIES, required: true, default: "medium" },
    priorityRank: { type: Number, required: true, default: 2 },
    tags: { type: [String], default: [] },
    position: { type: Number, required: true, default: 1024 },
    slaHours: { type: Number, required: true },
    slaCustom: { type: Boolean, required: true, default: false },
    slaDueAt: { type: Date, required: true },
    slaAtRiskAt: { type: Date, required: true },
    dueDate: { type: String, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    statusHistory: { type: [historySchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

taskSchema.index({ userId: 1, deletedAt: 1, status: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, slaDueAt: 1 });

export type TaskDocument = HydratedDocument<TaskFields>;
export const TaskModel = model<TaskFields>("Task", taskSchema);
