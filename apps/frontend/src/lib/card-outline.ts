import type { Ticket } from '@potato-cannon/shared'

/**
 * What a card's outline says about how it got where it is.
 *
 * The board told a reader where every card was and nothing about how it arrived. A card
 * in Done that was promoted through the Gate and a card somebody dragged there looked
 * the same, and a card that had just been refused looked exactly like a card that had
 * never been tried. On 2026-09-24 a card sat in Gate with its work finished and green,
 * refused, and the board said only "Gate".
 *
 * Two outlines and no more. Green is subdued on purpose: Done is the ordinary end of a
 * card's life, not an achievement to be shouted, and a board of bright green cards
 * teaches a reader to stop seeing green.
 */
export type CardOutline = 'promoted' | 'refused' | null

export function cardOutline(ticket: Pick<Ticket, 'phase' | 'history'>): CardOutline {
  const history = ticket.history ?? []

  // The most recent thing that happened to this card. A refusal that has since been
  // followed by a real move is history; a refusal that is the last word is the state.
  const last = history[history.length - 1]
  if (last?.refused) return 'refused'

  if (String(ticket.phase ?? '').trim().toLowerCase() === 'done') return 'promoted'
  return null
}
