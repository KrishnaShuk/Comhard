import { STATUS_LABELS, type Status } from "@taskflow/shared";

export function transitionLabel(from: Status, to: Status): string {
  if (from === "todo" && to === "in_progress") return "Start";
  if (from === "in_progress" && to === "done") return "Mark done";
  if (from === "in_progress" && to === "todo") return "Move back to To do";
  if (from === "done" && to === "in_progress") return "Reopen";
  return `Move to ${STATUS_LABELS[to]}`;
}
