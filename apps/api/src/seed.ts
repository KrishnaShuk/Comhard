import argon2 from "argon2";
import {
  PRIORITY_RANK,
  SLA_HOURS,
  addDaysToDateKey,
  getSlaWindow,
  getTodayInTz,
  type Priority,
  type Status,
} from "@taskflow/shared";
import { config } from "./config";
import { connectDatabase, disconnectDatabase } from "./db";
import { UserModel } from "./models/User";
import {
  TaskModel,
  type StatusHistoryFields,
  type TaskFields,
} from "./models/Task";
import { logger } from "./logger";

const DEMO_EMAIL = "demo@taskflow.dev";
const DEMO_PASSWORD = "TaskFlowDemo123!";
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

interface SeedSpec {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  state: "on_track" | "at_risk" | "breached" | "met";
  dueInDays?: number | null;
  reopened?: boolean;
  archived?: boolean;
  tags?: string[];
}

const specs: SeedSpec[] = [
  { title: "Follow up with Acme on renewals", description: "Confirm the two-seat expansion before Friday.", priority: "high", status: "todo", state: "on_track", dueInDays: 2, tags: ["client"] },
  { title: "Draft Q4 customer health report", description: "Pull usage and support trends into one page.", priority: "medium", status: "todo", state: "on_track", dueInDays: 5, tags: ["internal"] },
  { title: "Book discovery call with Northwind", description: "Find a slot with their ops lead.", priority: "low", status: "todo", state: "on_track", dueInDays: null, tags: ["client"] },
  { title: "Update onboarding checklist", description: "Add the security review step.", priority: "medium", status: "todo", state: "on_track", dueInDays: 4, tags: ["internal"] },
  { title: "Confirm invoice details with legal", description: "Waiting on the vendor code.", priority: "high", status: "todo", state: "on_track", dueInDays: 1, tags: ["finance"] },
  { title: "Write a note for the Monday standup", description: "Two blockers, one decision needed.", priority: "low", status: "todo", state: "on_track", dueInDays: 0, tags: ["internal"] },
  { title: "Send pricing sheet to Contoso", description: "They asked for annual and monthly options.", priority: "urgent", status: "todo", state: "at_risk", dueInDays: 1, tags: ["client"] },
  { title: "Review support escalation policy", description: "The 24h window is too blunt for weekends.", priority: "medium", status: "todo", state: "at_risk", dueInDays: 3, tags: ["internal"] },
  { title: "Schedule the quarterly review", description: "Three stakeholders still need to confirm.", priority: "low", status: "todo", state: "at_risk", dueInDays: 2, tags: ["client"] },
  { title: "Chase the signed order form", description: "Second reminder sent yesterday.", priority: "urgent", status: "todo", state: "breached", dueInDays: -2, tags: ["client"] },
  { title: "Resolve duplicate CRM contact", description: "Merge before the campaign import.", priority: "high", status: "todo", state: "breached", dueInDays: -1, tags: ["ops"] },
  { title: "Return the security questionnaire", description: "Legal needs to review the data section.", priority: "medium", status: "todo", state: "breached", dueInDays: -3, tags: ["client"] },

  { title: "Prepare renewal proposal", description: "Include the new workflow module.", priority: "urgent", status: "in_progress", state: "on_track", dueInDays: 2, tags: ["client"] },
  { title: "Clean up the pipeline board", description: "Archive stale opportunities.", priority: "low", status: "in_progress", state: "on_track", dueInDays: 6, tags: ["ops"] },
  { title: "Write the customer newsletter", description: "First draft is in the doc.", priority: "medium", status: "in_progress", state: "on_track", dueInDays: 4, tags: ["marketing"] },

  { title: "Migrate the trial accounts", description: "Half of the accounts are done.", priority: "high", status: "in_progress", state: "at_risk", dueInDays: 0, tags: ["ops"] },
  { title: "Fix the billing export", description: "Currency column is still wrong.", priority: "urgent", status: "in_progress", state: "at_risk", dueInDays: 1, tags: ["finance"] },
  { title: "Review the partner brief", description: "Marketing is waiting on comments.", priority: "medium", status: "in_progress", state: "at_risk", dueInDays: 3, tags: ["marketing"] },

  { title: "Reconcile last month's invoices", description: "Two lines do not match the contract.", priority: "urgent", status: "in_progress", state: "breached", dueInDays: -1, tags: ["finance"] },
  { title: "Rebuild the saved-view filters", description: "The old query still runs on Sundays.", priority: "high", status: "in_progress", state: "breached", dueInDays: 2, tags: ["internal"] },
  { title: "Reopen: send the churn survey", description: "Reopened after the copy was rejected.", priority: "high", status: "in_progress", state: "breached", dueInDays: -4, reopened: true, tags: ["client"] },

  { title: "Send the welcome sequence", description: "Five emails, one trigger.", priority: "medium", status: "done", state: "met", dueInDays: -2, tags: ["marketing"] },
  { title: "Close the Fabrikam contract", description: "Signed and filed.", priority: "urgent", status: "done", state: "met", dueInDays: -1, tags: ["client"] },
  { title: "Update the CRM stages", description: "Mapped to the new sales process.", priority: "high", status: "done", state: "met", dueInDays: -3, tags: ["ops"] },
  { title: "Publish the help center article", description: "Covers the new export flow.", priority: "low", status: "done", state: "met", dueInDays: -5, tags: ["internal"] },
  { title: "Run the weekly pipeline review", description: "Notes shared with the team.", priority: "medium", status: "done", state: "met", dueInDays: -4, tags: ["ops"] },
  { title: "Resolve the SSO ticket", description: "Key rotation fixed the issue.", priority: "high", status: "done", state: "met", dueInDays: -2, tags: ["client"] },
  { title: "Refresh the pricing page copy", description: "Removed the old trial wording.", priority: "low", status: "done", state: "met", dueInDays: -6, tags: ["marketing"] },
  { title: "Book the offsite venue", description: "Deposit paid.", priority: "medium", status: "done", state: "met", dueInDays: -7, tags: ["internal"] },
  { title: "Send the quarterly board update", description: "Delivered ahead of the meeting.", priority: "high", status: "done", state: "met", dueInDays: -10, tags: ["internal"] },
  { title: "Archive old campaign assets", description: "Cleaned up the shared drive.", priority: "low", status: "done", state: "met", dueInDays: -12, tags: ["marketing"] },
  { title: "Document the refund policy", description: "Added examples and edge cases.", priority: "medium", status: "done", state: "met", dueInDays: -8, tags: ["finance"] },
  { title: "Ship the contact import fix", description: "Duplicates are now skipped.", priority: "high", status: "done", state: "met", dueInDays: -3, tags: ["ops"] },
  { title: "Deliver the migration report", description: "Finished two days after the deadline.", priority: "high", status: "done", state: "breached", dueInDays: -4, tags: ["ops"] },
  { title: "Reply to the security review", description: "Legal signed off late.", priority: "medium", status: "done", state: "breached", dueInDays: -6, tags: ["client"] },
  { title: "Send the partner recap", description: "Missed the original SLA window.", priority: "low", status: "done", state: "breached", dueInDays: -9, tags: ["marketing"] },

  { title: "Close the annual archive", description: "Last year's signed agreements.", priority: "low", status: "done", state: "met", dueInDays: -20, archived: true, tags: ["finance"] },
  { title: "Old office move checklist", description: "Kept for reference.", priority: "medium", status: "todo", state: "breached", dueInDays: -30, archived: true, tags: ["ops"] },
];

function makeTiming(spec: SeedSpec, now: number): {
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
} {
  const slaHours = SLA_HOURS[spec.priority];
  let createdAt: number;
  let completedAt: number | null = null;

  if (spec.status === "done") {
    if (spec.state === "met") {
      createdAt = now - 4 * DAY;
      completedAt = createdAt + 0.5 * slaHours * HOUR;
    } else {
      createdAt = now - 5 * DAY;
      completedAt = createdAt + 1.3 * slaHours * HOUR;
    }
  } else if (spec.state === "on_track") {
    createdAt = now - 0.2 * slaHours * HOUR;
  } else if (spec.state === "at_risk") {
    createdAt = now - 0.82 * slaHours * HOUR;
  } else {
    createdAt = now - 1.6 * slaHours * HOUR;
  }

  let startedAt: number | null = null;
  if (spec.status !== "todo") startedAt = createdAt + 15 * 60 * 1000;

  return {
    createdAt: new Date(createdAt),
    startedAt: startedAt ? new Date(startedAt) : null,
    completedAt: completedAt ? new Date(completedAt) : null,
  };
}

function makeHistory(
  spec: SeedSpec,
  timing: { createdAt: Date; startedAt: Date | null; completedAt: Date | null },
  now: number,
): StatusHistoryFields[] {
  const history: StatusHistoryFields[] = [
    { from: null, to: "todo", at: timing.createdAt },
  ];

  if (timing.startedAt) {
    history.push({ from: "todo", to: "in_progress", at: timing.startedAt });
  }

  if (spec.reopened) {
    const reopenedAt = now - 2 * HOUR;
    const doneAt = Math.min(timing.createdAt.getTime() + 0.5 * HOUR, reopenedAt - HOUR);
    history.push({ from: "in_progress", to: "done", at: new Date(doneAt) });
    history.push({ from: "done", to: "in_progress", at: new Date(reopenedAt) });
  } else if (spec.status === "done" && timing.completedAt) {
    history.push({
      from: "in_progress",
      to: "done",
      at: timing.completedAt,
    });
  }

  return history;
}

async function seed(): Promise<void> {
  if (config.nodeEnv === "production") {
    throw new Error("Refusing to seed in production");
  }

  await connectDatabase();

  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  const user = await UserModel.findOneAndUpdate(
    { email: DEMO_EMAIL },
    { name: "Demo", email: DEMO_EMAIL, passwordHash },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await TaskModel.deleteMany({ userId: user._id });

  const now = Date.now();
  const today = getTodayInTz("UTC");
  const positions: Record<Status, number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
  };

  const documents: TaskFields[] = specs.map((spec) => {
    const timing = makeTiming(spec, now);
    const slaHours = SLA_HOURS[spec.priority];
    const window = getSlaWindow(timing.createdAt, slaHours);
    const history = makeHistory(spec, timing, now);
    positions[spec.status] += 1024;

    return {
      userId: user._id,
      title: spec.title,
      description: spec.description,
      status: spec.status,
      priority: spec.priority,
      priorityRank: PRIORITY_RANK[spec.priority],
      tags: spec.tags ?? [],
      position: positions[spec.status],
      slaHours,
      slaCustom: false,
      slaDueAt: window.slaDueAt,
      slaAtRiskAt: window.slaAtRiskAt,
      dueDate:
        spec.dueInDays === undefined || spec.dueInDays === null
          ? null
          : addDaysToDateKey(today, spec.dueInDays),
      startedAt: timing.startedAt,
      completedAt: timing.completedAt,
      statusHistory: history,
      deletedAt: spec.archived ? new Date(now - 2 * DAY) : null,
      createdAt: timing.createdAt,
      updatedAt: new Date(),
    };
  });

  await TaskModel.create(documents);

  logger.info(
    {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      tasks: documents.length,
      archived: documents.filter((task) => task.deletedAt).length,
    },
    "Seed complete",
  );
  console.log(`\nDemo account: ${DEMO_EMAIL}\nPassword:     ${DEMO_PASSWORD}\n`);
}

seed()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error({ err: error }, "Seed failed");
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
