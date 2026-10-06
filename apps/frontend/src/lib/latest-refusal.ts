import type { TicketHistoryEntry } from '@potato-cannon/shared'

/**
 * The refusal a reader needs to see on opening a card, or null.
 *
 * A refused move is already written to the card's history, and history is now folded
 * under the record, shut to begin with. So the one thing a reader most needs on opening
 * a refused card was two controls away: the card sat where it was, and the reason it
 * had not moved was somewhere nobody looks.
 *
 * It is the *latest* row and only the latest. A refusal that has been answered, by the
 * card moving afterwards, is history rather than news, and a card showing an old
 * refusal above a move that succeeded is worse than showing nothing.
 */
export interface LatestRefusal {
  /** The column the card was refused entry to. */
  phase: string
  /** What the check said, when it said anything. */
  reason?: string
  /** Who asked for the move. */
  actor?: string
  when: string
}

export function latestRefusal(
  history?: TicketHistoryEntry[] | null,
): LatestRefusal | null {
  if (!history || history.length === 0) return null
  // The store appends, so the last row is the most recent thing that happened.
  const last = history[history.length - 1]
  if (!last?.refused) return null
  return {
    phase: last.phase,
    reason: last.reason,
    actor: last.actor,
    when: last.at,
  }
}
