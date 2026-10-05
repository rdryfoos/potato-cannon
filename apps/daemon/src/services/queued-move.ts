// src/services/queued-move.ts
//
// A move made while the card is busy, and what happens to it.
//
// Moving a card into a phase that has workers spawns one. If a session was already
// running on that card, the spawn was skipped with a line in the daemon's log and
// nothing else:
//
//     Ticket BAN-1 already has an active session, skipping spawn
//
// The move itself was not dropped: `updateTicket` has already run by then, so the card
// is in the new column and the board says so. What is missing is the worker. A hand
// dragged two cards into Build that way and both sat there looking like work was about
// to happen. That is worse than a refused move, because the board is wrong rather than
// unchanged.
//
// So the move is kept and the spawn is queued, on the card where a person can see it.
// The queue is a line in the card's own description rather than a column, because the
// board already renders those lines and a queue nobody can see is the defect again.
import { getLine, removeLine, setLine } from "./card-description.js";

/** The line's name. One per card: a card has one phase to be worked in at a time. */
export const QUEUED_LINE = "queued-worker";

export type SpawnDecision = "spawn" | "queue" | "nothing";

/**
 * What a move should do about the worker, given what is running.
 *
 * Pure, because the three-way choice is the thing worth testing and the route around it
 * is not. `nothing` is a phase with no workers, which is most of them.
 */
export function spawnDecision(input: {
  hasAutomation: boolean;
  activeSession: boolean;
}): SpawnDecision {
  if (!input.hasAutomation) return "nothing";
  return input.activeSession ? "queue" : "spawn";
}

/** The description with the queue line written on it, for a phase and a reason. */
export function queueOnCard(description: string, phase: string, now: string): string {
  return setLine(
    description,
    QUEUED_LINE,
    `${phase}, waiting for the session running on this card to end, since ${now}`,
  );
}

/** The phase a card is waiting to have a worker in, or null. */
export function queuedPhase(description: string): string | null {
  const line = getLine(description, QUEUED_LINE);
  if (!line) return null;
  const phase = line.split(",")[0].trim();
  return phase || null;
}

/** The description with the queue line taken off, once it has been acted on. */
export function clearQueueOnCard(description: string): string {
  return removeLine(description, QUEUED_LINE);
}

export interface DrainDeps {
  /** The card's description as it stands. */
  description: string;
  /** Whether a session is running on this card right now, liveness-checked. */
  activeSession: boolean;
  /** Whether that phase still has workers. A template can change under a queued card. */
  hasWorkers: (phase: string) => Promise<boolean> | boolean;
  /** The phase the card is in now. A queue for a phase it has left is stale. */
  currentPhase: string;
}

export type DrainResult =
  | { action: "spawn"; phase: string; description: string }
  | { action: "drop"; why: string; description: string }
  | { action: "wait" }
  | { action: "none" };

/**
 * What to do with a queued move now that a session has ended.
 *
 * Four answers, and three of them write the line off the card. A queue that cannot be
 * acted on has to be taken down, or the card carries a promise of work that is never
 * coming, which is the same fault one step along.
 */
export async function drainQueuedMove(deps: DrainDeps): Promise<DrainResult> {
  const phase = queuedPhase(deps.description);
  if (!phase) return { action: "none" };
  // Another session started between the end of that one and this check. Leave the line
  // alone: the next ending drains it.
  if (deps.activeSession) return { action: "wait" };
  if (phase !== deps.currentPhase) {
    return {
      action: "drop",
      why: `the card is in ${deps.currentPhase} now, not ${phase}`,
      description: clearQueueOnCard(deps.description),
    };
  }
  if (!(await deps.hasWorkers(phase))) {
    return {
      action: "drop",
      why: `${phase} has no workers any more`,
      description: clearQueueOnCard(deps.description),
    };
  }
  return { action: "spawn", phase, description: clearQueueOnCard(deps.description) };
}
