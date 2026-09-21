export interface ConversationEntry {
  id: string
  question: string
  options?: string[]
  askedAt: string
  phase?: string
  answer?: string
  answeredAt?: string
}

export interface TicketPendingQuestion {
  conversationId: string
  question: string
  options?: string[]
  askedAt: string
  phase?: string
  claudeSessionId?: string
}

export interface TicketPendingResponse {
  question?: TicketPendingQuestion
}

/**
 * Who said a thing, as the Activity feed needs to show it.
 *
 * `type` is the shape of a message and has never been its author: a phase
 * worker's question, the Q&A agent's answer and the daemon's own notice were
 * three speakers wearing two bubbles. `kind` picks the colour and the side;
 * `name` is the caption, because "Spec worker" and "Build worker" are the same
 * kind and are not the same speaker.
 */
export type SpeakerKind = 'person' | 'worker' | 'buddy' | 'cannon'

export interface MessageSpeaker {
  kind: SpeakerKind
  name: string
}

export interface TicketMessage {
  type: 'question' | 'user' | 'notification' | 'artifact'
  text: string
  /**
   * Present on every message the daemon returns. The store fills it in for rows
   * written before speakers existed, by inference from what those rows carry.
   */
  speaker?: MessageSpeaker
  conversationId?: string
  options?: string[]
  timestamp: string
  artifact?: {
    filename: string
    description?: string
  }
  // Tags set by ChatService.getAdhocChatMetadata (artifact-chat / ticket-chat
  // sessions) so a specific artifact's Q&A panel can fetch and filter its
  // own history out of the shared ticket conversation on mount.
  metadata?: {
    artifactFilename?: string
    ticketChat?: boolean
    [key: string]: unknown
  }
}

export interface TicketMessagesResponse {
  messages: TicketMessage[]
}

export interface ArtifactChatMessage {
  type: 'question' | 'user' | 'error' | 'system'
  text: string
  conversationId?: string
  options?: string[]
  timestamp: string
}

export interface ArtifactChatPendingResponse {
  question?: {
    conversationId: string
    question: string
    options?: string[]
    askedAt: string
  }
  sessionActive: boolean
  endReason?: 'completed' | 'error' | 'timeout'
}

export interface ArtifactChatStartResponse {
  sessionId: string
  contextId: string
}
