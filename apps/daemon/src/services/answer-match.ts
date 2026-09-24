/**
 * Whether what a person typed is one of the answers a worker offered.
 *
 * A suspended worker's question often comes with options. The input route took
 * whatever arrived, wrote it as the answer and resumed the worker with it, so a person
 * typing anything at all into the composer answered a question they may not have been
 * looking at. On the second cold run Rik typed "Buddy?" while BAN-1's worker was
 * suspended; that became the answer, the worker resumed on it, and the card went red.
 *
 * A question with no options is a question in free text, and anything is an answer to
 * it. A question with options has a closed set, and a message outside that set is not
 * an answer: it is conversation, and belongs in the thread.
 *
 * Matching is lenient about case and surrounding space, because a person retyping an
 * option is answering it, and strict about everything else, because the point is to
 * tell an answer from a remark.
 */
export function matchesOfferedAnswer(
  options: string[] | null | undefined,
  message: string,
): boolean {
  if (!options || options.length === 0) return true;
  const typed = message.trim().toLowerCase();
  if (!typed) return false;
  return options.some((option) => String(option).trim().toLowerCase() === typed);
}
