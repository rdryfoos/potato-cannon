import { roleOf, type PhaseLike } from '@potato-cannon/shared'

/**
 * The columns where somebody is asking whether the thing works.
 *
 * Try it and Buddy were offered in the review column only, and the column was found by
 * name: `phase === 'Review' || phase === 'Align'`. Every project that renamed a column
 * had to be added to that list, and a project nobody had thought of lost the button.
 *
 * It asks what the column is *for* now. A template that declares a role is believed; a
 * template that says nothing is read by its names, so a board that still says Align
 * keeps working and nothing has to be renamed for anything to keep running.
 *
 * Done is here as well as review, because a card in Done is a card somebody comes back
 * to, to see what it built or find out what it was for.
 */
export function isAskableColumn(phase?: string | null, phases?: PhaseLike[] | null): boolean {
  const role = roleOf(phase, phases)
  return role === 'review' || role === 'done'
}
