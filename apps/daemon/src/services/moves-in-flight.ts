// src/services/moves-in-flight.ts
//
// One move at a time, per card.
//
// A move runs the target column's entry check before it is allowed, and an entry check
// may take a while: Bang's Done check is given fifteen minutes, because it runs a Gate.
// Nothing stopped a second drag arriving in that window. Both moves ran their checks,
// both wrote, and the card ended wherever the slower one finished, with no record that
// two people had asked for two different things.
//
// So a card has one move in flight at a time and the second is refused, visibly, the
// way every other refusal on this route is.
export interface MoveInFlight {
  toPhase: string;
  actor: string;
  since: string;
}

/** The moves running right now, by ticket id. In memory on purpose: see `begin`. */
const running = new Map<string, MoveInFlight>();

/**
 * Claim this card's one move, or find out who already has it.
 *
 * Returns null when the claim is yours, or the move already in flight when it is not.
 *
 * In memory rather than in the database, because the thing being guarded is a request
 * this process is in the middle of. A daemon that restarts mid-check has lost the check
 * with it, and a lock that outlived the process would leave a card unmovable until
 * somebody found the row.
 */
export function beginMove(
  ticketId: string,
  move: MoveInFlight,
  state: Map<string, MoveInFlight> = running,
): MoveInFlight | null {
  const held = state.get(ticketId);
  if (held) return held;
  state.set(ticketId, move);
  return null;
}

/** Give the card's move back. Always in a finally: a move that throws still ends. */
export function endMove(ticketId: string, state: Map<string, MoveInFlight> = running): void {
  state.delete(ticketId);
}

/** The move in flight for this card, or null. */
export function moveInFlight(
  ticketId: string,
  state: Map<string, MoveInFlight> = running,
): MoveInFlight | null {
  return state.get(ticketId) ?? null;
}

/** What to tell a person whose move arrived second. */
export function refusalFor(held: MoveInFlight): string {
  return `a move to ${held.toPhase} is already running for this card, asked by ${held.actor} at ${held.since}`;
}
