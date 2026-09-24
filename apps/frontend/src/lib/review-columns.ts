/**
 * The columns where somebody is asking whether the thing works.
 *
 * Try it and Buddy were offered in the review column only. That is where a person
 * first asks, but it is not the last place they ask: a card in Done is a card somebody
 * comes back to, to see what it built, or to find out what it was for. On 2026-09-23 a
 * reader opening a card in Done had neither the button nor the agent, on the one card
 * whose answer was finished.
 *
 * The column is named Review in the stock template, Align in a project that renamed it,
 * and Done is Done everywhere. Matching on the name rather than the position is what
 * lets a board that still says Align keep working.
 */
const ASKABLE = new Set(['review', 'align', 'done'])

export function isAskableColumn(phase?: string | null): boolean {
  return ASKABLE.has(String(phase ?? '').trim().toLowerCase())
}
