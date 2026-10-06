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

/**
 * The column where moving a card by hand is a decision somebody is making.
 *
 * Promote and Demote were on every card in every column, which reads as an invitation
 * to drag a card forward from Spec or back out of Build. Those are not decisions a hand
 * makes: the columns before review are the Cannon's to move a card through, and a card
 * leaves them when its worker is finished. Review is the one column where a person has
 * looked at what was built and is deciding what happens to it, which is what those two
 * controls are for.
 *
 * Done is not here, although `isAskableColumn` includes it. A card in Done is finished,
 * and Try it and Buddy are for reading it afterwards, not for moving it again.
 *
 * By role rather than by name, for the reason that file's own header gives.
 */
export function isDecisionColumn(phase?: string | null, phases?: PhaseLike[] | null): boolean {
  return roleOf(phase, phases) === 'review'
}
