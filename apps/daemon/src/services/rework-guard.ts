/**
 * Who may write a Rework block, and when.
 *
 * A Rework block is an instruction to the Build worker: it is read at the start of an
 * attempt, before anything else. Written while an attempt is already running, it is an
 * instruction the worker has read past, or will read halfway through, and neither the
 * writer nor the worker can tell which. The card then says a change was asked for and
 * the attempt that was running never saw it.
 *
 * Buddy is the caller this is for. It is now answerable while a worker runs, which is
 * the point of the To: control, and answering is all it may do until the worker lands.
 * A person is not stopped: Rik writes Rework blocks by hand, and a hand that writes one
 * mid-run has chosen to, whereas an agent has merely been asked a question.
 */
export interface ReworkGuardInput {
  /** Block names the caller is writing. */
  blocks?: Array<{ name: string }>;
  /** Whether a phase worker is running or suspended on this card. */
  workerActive: boolean;
  /** True when the caller declared itself something other than a hand. */
  fromAgent: boolean;
}

export const REWORK_BLOCK = "rework";

export function refusesReworkWrite(input: ReworkGuardInput): string | null {
  if (!input.fromAgent || !input.workerActive) return null;
  const writing = (input.blocks ?? []).some(
    (b) => String(b?.name ?? "").trim().toLowerCase() === REWORK_BLOCK,
  );
  if (!writing) return null;
  return (
    "A Rework block is an instruction the Build worker reads at the start of an " +
    "attempt, and an attempt is running on this card now. Answer the question you " +
    "were asked; write the block when the worker lands."
  );
}
