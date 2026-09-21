// src/services/transcript.ts
//
// The card's conversation, as something an agent can read.
//
// The ticket Q&A agent was built from six things: its prompt file, the card's
// title, description and phase, a list of artifact filenames, and the one message
// the person had just typed. Not the conversation. So it could answer about the
// card and could not answer about the card's own thread: asked on 2026-09-20 what
// the Spec worker had asked and what answering "A" would do, it said, correctly,
// that a chat_ask lives in the conversation and the conversation was not anywhere
// it could read.
//
// Within one open panel this never showed, because a follow-up resumes the same
// Claude session and its own turns are still in its context. It showed the moment
// the panel closed and a new session started with no history at all.
//
// This renders that history. It is only worth sending because messages now carry a
// speaker: "Spec worker", "Buddy", "Cannon", "You". The same transcript before that
// would have read Potato, Potato, Status Update, You, which is not a transcript, it
// is a wall.

import type { ConversationMessage } from "../types/conversation.types.js";

export interface TranscriptLimits {
  /** How many messages to keep, newest first. */
  maxMessages?: number;
  /** A ceiling on the whole rendered transcript. */
  maxChars?: number;
  /** A ceiling on any one message, so a review packet cannot eat the budget. */
  maxCharsPerMessage?: number;
}

const DEFAULTS: Required<TranscriptLimits> = {
  maxMessages: 40,
  maxChars: 12000,
  maxCharsPerMessage: 1500,
};

function speakerName(message: ConversationMessage): string {
  return message.speaker?.name || (message.type === "user" ? "You" : "A worker");
}

function bodyOf(message: ConversationMessage, cap: number): string {
  if (message.type === "artifact") {
    const artifact = message.metadata?.artifact as { filename?: string } | undefined;
    return artifact?.filename ? `attached ${artifact.filename}` : "attached an artifact";
  }

  const text = (message.text || "").trim();
  if (text.length <= cap) return text;
  // Cut at the end rather than the middle: a question's opening says what it is
  // about, and a truncation that hides which end was cut is a small lie.
  return `${text.slice(0, cap).trimEnd()}\n[... ${text.length - cap} more characters, not shown]`;
}

function indent(text: string, pad: string): string {
  return text.split("\n").join(`\n${pad}`);
}

/**
 * Render a card's conversation as a script with names on it.
 *
 * Newest messages are kept and oldest are dropped, because the near end of a
 * thread is what a follow-up is usually about. When anything is dropped the
 * transcript says so and says how many, so the agent knows its view is partial
 * and can say so too rather than answering as though it had the whole thing.
 */
export function renderTranscript(
  messages: ConversationMessage[],
  limits: TranscriptLimits = {},
): string {
  const { maxMessages, maxChars, maxCharsPerMessage } = { ...DEFAULTS, ...limits };

  if (!messages.length) {
    return "(nothing has been said on this card yet)";
  }

  const kept: string[] = [];
  let dropped = 0;
  let used = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    if (kept.length >= maxMessages) {
      dropped = i + 1;
      break;
    }
    const message = messages[i];
    const name = speakerName(message);
    const line = `${name}: ${indent(bodyOf(message, maxCharsPerMessage), " ".repeat(name.length + 2))}`;

    if (used + line.length > maxChars && kept.length > 0) {
      dropped = i + 1;
      break;
    }
    kept.push(line);
    used += line.length + 2;
  }

  kept.reverse();

  const head = dropped
    ? `The ${dropped} message(s) before these are not shown. This is the end of the ` +
      `thread, not all of it; say so if the answer depends on what came earlier.\n\n`
    : "";

  return head + kept.join("\n\n");
}
