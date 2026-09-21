export interface Conversation {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Who said a thing.
 *
 * `type` says what shape a message is; it has never said who produced it. A
 * question from the Spec worker, a question from the ticket Q&A agent and a
 * notification the daemon wrote about itself were all one of two bubbles, so a
 * reader scrolling a card could not tell a worker's guess from the daemon's
 * fact without knowing the machinery.
 *
 *   person  the human at the panel. Only the panel: anything else reaching the
 *           card over the API is machinery and says which machinery it is.
 *   worker  a phase worker, named for the phase it runs in and the agent that
 *           runs it, e.g. "Spec worker", "Build worker", "Gate runner".
 *   buddy   the ticket Q&A agent, which reads a card and answers about it.
 *   cannon  the daemon speaking for itself, and any other caller that is not
 *           the panel, named by where it came from.
 */
export type SpeakerKind = "person" | "worker" | "buddy" | "cannon";

export interface MessageSpeaker {
  kind: SpeakerKind;
  /** What the feed calls this speaker. "Spec worker", "Buddy", "Cannon". */
  name: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  type: "question" | "user" | "notification" | "artifact";
  text: string;
  options?: string[];
  timestamp: string;
  answeredAt?: string;
  metadata?: Record<string, unknown>;
  /**
   * Absent on rows written before speakers existed. The store fills those in
   * on read from what the row does carry, rather than leaving old history
   * unlabelled or claiming a speaker it cannot know.
   */
  speaker?: MessageSpeaker;
}

export interface CreateMessageInput {
  type: ConversationMessage["type"];
  text: string;
  options?: string[];
  metadata?: Record<string, unknown>;
  speaker?: MessageSpeaker;
}
