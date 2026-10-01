// src/services/card-move.ts
//
// What a move writes on the card, as one pure function.
//
// Two things happen to a card's own lines when it changes column, and both were inline
// in the PATCH route where nothing could test them against the awkward cases. A card
// sent backwards says so on itself, and a refusal written in Build does not outlive
// Build. Neither is I/O: given the description and the two phases, the answer is a
// string, which is the shape card-description.ts's own primitives are in and for the
// same reason.
import { removeLine, setLine } from "./card-description.js";

export interface MoveInput {
  /** The description the move starts from, including any edit arriving in the same call. */
  description: string;
  oldPhase: string;
  newPhase: string;
  /** "hand:<user>", "auto", or "hook:<name>", as the route computes it. */
  actor: string;
  /** The project's phases in order, for deciding which way the card went. */
  phases: string[];
  /** Injected so a test can read the line it expects. */
  now?: () => string;
}

/**
 * The description after a move, or null when the move writes nothing.
 *
 * `blocked-reason:` goes when the card leaves Build, whichever way it is going. The
 * Build worker writes that line when it refuses to build what it was asked for, and
 * nothing took it off again: on BAN-1 it still read as the card's state in Review,
 * above a green verdict, describing a refusal three columns back. A reader cannot tell
 * a live refusal from a dead one, and the dead one is louder. The move is the answer to
 * it, and the history tab keeps the record of both.
 */
export function descriptionForMove(input: MoveInput): string | null {
  const { description, oldPhase, newPhase, actor, phases } = input;
  if (oldPhase === newPhase) return null;

  let next = description;
  let changed = false;

  if (oldPhase === "Build") {
    const cleared = removeLine(next, "blocked-reason");
    if (cleared !== next) {
      next = cleared;
      changed = true;
    }
  }

  const from = phases.indexOf(oldPhase);
  const to = phases.indexOf(newPhase);
  if (from >= 0 && to >= 0 && to < from) {
    const stamp = (input.now ?? (() => new Date().toISOString()))();
    next = setLine(next, "sent-back", `from ${oldPhase} to ${newPhase} by ${actor} on ${stamp}`);
    changed = true;
  }

  return changed ? next : null;
}
