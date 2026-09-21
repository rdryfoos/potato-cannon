// src/services/speaker.ts
//
// Who is talking, and what the feed should call them.
//
// The Activity feed had one discriminator, the message's `type`, and it described
// the shape of a message rather than its author. A phase worker asking a question,
// the ticket Q&A agent answering one, and an artifact chat asking a third thing all
// arrived as the same bubble under the same name. This is the small amount of
// knowledge needed to tell them apart, kept in one file so there is one place to
// read and one place to correct.

import type { MessageSpeaker } from "../types/conversation.types.js";

/** The ad-hoc agents, by the agent_source their sessions are created with. */
const TICKET_QA = "ticket-qa";
const ARTIFACT_QA = "artifact-qa";

export const CANNON: MessageSpeaker = { kind: "cannon", name: "Cannon" };
export const BUDDY: MessageSpeaker = { kind: "buddy", name: "Buddy" };
export const PERSON: MessageSpeaker = { kind: "person", name: "You" };

/**
 * A caller that reached a card over the API without being the panel.
 *
 * The Q&A route used to write everything it received as a `user` message, so a
 * script, a cron job or another agent posting to it appeared in the feed as the
 * person sitting at the board. Anything that is not the panel says what it is;
 * anything that says nothing is named as the unnamed thing it is, which is still
 * truer than putting words in a person's mouth.
 */
export function callerSpeaker(origin?: string | null): MessageSpeaker {
  const declared = (origin || "").trim();
  if (declared === "panel") return PERSON;
  if (!declared) return { kind: "cannon", name: "An unnamed caller" };
  // Kept short and inert: this string is rendered as a label, and a caller does
  // not get to choose how much of the feed it occupies.
  const safe = declared.replace(/[^A-Za-z0-9 ._:-]/g, "").slice(0, 40);
  return { kind: "cannon", name: safe || "An unnamed caller" };
}

/** Words an agent's file name can end in that already name its role. */
const ROLE_WORDS = ["runner", "worker", "reviewer", "agent", "bot"];

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Turn a session's agent_source and phase into what the feed calls that worker.
 *
 * The rule, rather than a table of three names: the phase says which worker this
 * is, and the agent's own file name says what kind of thing it is. `agents/spec.md`
 * in the Spec phase is the "Spec worker"; `agents/runner.md` in the Gate phase is
 * the "Gate runner", because an agent called a runner is a runner and calling it a
 * worker would be the Cannon renaming somebody else's agent. An agent whose name
 * carries no role word is a worker.
 *
 * With no phase to hand, the agent's own name carries the label, which is worse but
 * is not a guess: it is the one fact the session actually recorded.
 */
export function workerSpeaker(
  agentSource?: string | null,
  phase?: string | null,
): MessageSpeaker {
  const source = (agentSource || "").trim();
  if (source === TICKET_QA) return BUDDY;
  if (source === ARTIFACT_QA) return { kind: "buddy", name: "Artifact Q&A" };

  const base = source
    .replace(/^agents\//, "")
    .replace(/\.md$/, "")
    .trim()
    .toLowerCase();

  const roleWord = ROLE_WORDS.find((w) => base === w || base.endsWith(`-${w}`)) || "worker";
  const stage = (phase || "").trim();

  if (stage) return { kind: "worker", name: `${titleCase(stage)} ${roleWord}` };
  if (base) return { kind: "worker", name: `${titleCase(base)} ${roleWord}` };
  return { kind: "worker", name: "A worker" };
}

/**
 * What to call a message that was written before speakers existed, or by a path
 * that did not name one.
 *
 * This is inference and it is the only inference in the file. It reads what the row
 * does carry: a ticket-chat or artifact-chat marker in its metadata means an ad-hoc
 * agent, a phase means a worker, and a bare question with neither means a worker
 * whose phase nobody recorded. It never guesses a person: a `user` row is the one
 * case where the old schema and the new one agree.
 */
export function inferSpeaker(
  type: string,
  metadata?: Record<string, unknown>,
): MessageSpeaker {
  if (type === "user") return PERSON;

  const meta = metadata || {};
  if (meta.ticketChat === true) return BUDDY;
  if (typeof meta.artifactFilename === "string") return { kind: "buddy", name: "Artifact Q&A" };

  const phase = typeof meta.phase === "string" ? meta.phase : null;
  if (phase) return workerSpeaker(null, phase);

  // A notification with no phase is the one genuinely ambiguous row: chat_notify
  // from a worker and the daemon's own notices both landed here before V16. It is
  // labelled as the Cannon because the daemon is the only speaker that can be named
  // without knowing which session was running, and a wrong worker name would be worse
  // than a general one.
  if (type === "notification") return CANNON;
  return { kind: "worker", name: "A worker" };
}
