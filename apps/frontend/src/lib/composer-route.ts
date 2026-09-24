/**
 * Who a message from the Activity composer goes to.
 *
 * The composer had no choice in it: a message went to the phase worker whenever one
 * was running, and to Buddy only when none was. So a reader watching a card run could
 * not ask a question about it without answering the worker instead, and Buddy, whose
 * whole job is answering questions about a card, was unreachable during the only part
 * of a card's life anybody watches.
 *
 * The To: control makes it a choice. The default is what the composer used to do,
 * because a worker's question is usually what the reader is looking at.
 */
export type Recipient = 'worker' | 'buddy'

export type Route = 'worker-input' | 'buddy-continue' | 'buddy-start'

export interface ComposerState {
  /** A phase worker is running or has a question waiting. */
  isAgentActive: boolean
  /** An existing ticket-wide Q&A conversation with Buddy, if one is open. */
  ticketChatContextId: string | null
}

/** Who the composer addresses when the reader has not chosen. */
export function defaultRecipient(state: ComposerState): Recipient {
  return state.isAgentActive ? 'worker' : 'buddy'
}

/**
 * Where a message goes.
 *
 * `buddy` never returns `worker-input`, whatever the worker is doing. That is the rule
 * this function exists to keep: a question meant for Buddy must not arrive at a
 * suspended worker as the answer to its question, which is how a card went red on
 * 2026-09-23 when a person typed "Buddy?" into the composer.
 */
export function routeFor(to: Recipient, state: ComposerState): Route {
  if (to === 'worker') {
    return state.isAgentActive ? 'worker-input' : 'buddy-start'
  }
  return state.ticketChatContextId ? 'buddy-continue' : 'buddy-start'
}

/** Whether addressing the worker is possible at all. */
export function canAddressWorker(state: ComposerState): boolean {
  return state.isAgentActive
}
