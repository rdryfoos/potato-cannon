/**
 * Who may write a Rework block, and when.
 *
 * A Rework block is an instruction to the Build worker: it is read at the start of an
 * attempt, before anything else. Written while an attempt is already running, it is an
 * instruction the worker has read past, or will read halfway through, and neither the
 * writer nor the worker can tell which. The card then says a change was asked for and
 * the attempt that was running never saw it.
 *
 * Buddy is the caller this is for, and as of 2026-09-28 it does not write one at all.
 * A change within the card's promises it makes on the branch, under the Gate, with the
 * card staying in Review; a change to what the card promises it refuses, naming the ID
 * that would have to be created. Neither is a Rework block, and the block's one
 * remaining use is a person leaving work for the next Build attempt.
 *
 * So the refusal no longer turns on whether a worker is running. It was the narrower
 * rule when Buddy could write the block but should not have written it mid-attempt;
 * now the block is a hand's, and a quiet card is not a reason to hand an agent the
 * pen for the wrong thing. A person is not stopped: Rik writes them, and a hand that
 * writes one has chosen to, whereas an agent has merely been asked a question.
 */
export interface ReworkGuardInput {
  /** Block names the caller is writing. */
  blocks?: Array<{ name: string }>;
  /** Whether a phase worker is running or suspended on this card.
   *
   *  No longer part of the decision, and kept because the caller computes it anyway
   *  and a reader of this interface should see that it was considered. An agent may
   *  not write a Rework block on a quiet card either: the block is a hand's now. */
  workerActive?: boolean;
  /** True when the caller declared itself something other than a hand. */
  fromAgent: boolean;
}

export const REWORK_BLOCK = "rework";

export function refusesReworkWrite(input: ReworkGuardInput): string | null {
  if (!input.fromAgent) return null;
  const writing = (input.blocks ?? []).some(
    (b) => String(b?.name ?? "").trim().toLowerCase() === REWORK_BLOCK,
  );
  if (!writing) return null;
  return (
    "A Rework block is a hand's, for work being left to the next Build attempt. If " +
    "the change is within this card's promises, make it on the branch; if it needs a " +
    "promise the card does not carry, name the ID it would need and stop."
  );
}
