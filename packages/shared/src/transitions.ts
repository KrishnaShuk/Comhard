import { ALLOWED_TRANSITIONS } from "./constants";
import type { Status } from "./constants";

export function allowedTransitions(from: Status): readonly Status[] {
  return ALLOWED_TRANSITIONS[from];
}

export function canTransition(from: Status, to: Status): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
