import { describe, it, expect } from 'vitest'
import { canAddressWorker, defaultRecipient, routeFor } from './composer-route'

/**
 * Who a message from the Activity composer goes to.
 *
 * It went to the phase worker whenever one was running and to Buddy only when none
 * was. A reader watching a card run could not ask a question about it without
 * answering the worker instead, and Buddy was unreachable during the only part of a
 * card's life anybody watches.
 */
describe('the To: control', () => {
  const running = { isAgentActive: true, ticketChatContextId: null }
  const idle = { isAgentActive: false, ticketChatContextId: null }
  const talking = { isAgentActive: false, ticketChatContextId: 'chat-1' }
  const runningAndTalking = { isAgentActive: true, ticketChatContextId: 'chat-1' }

  it('defaults to the worker while one is running, which is what the composer used to do', () => {
    expect(defaultRecipient(running)).toBe('worker')
  })

  it('defaults to Buddy when no worker is running, which is also what it used to do', () => {
    expect(defaultRecipient(idle)).toBe('buddy')
  })

  it('sends a message addressed to the worker to the worker', () => {
    expect(routeFor('worker', running)).toBe('worker-input')
  })

  it('never sends a message addressed to Buddy into the worker session', () => {
    // The rule this exists to keep. A question meant for Buddy arriving at a suspended
    // worker as the answer to its question is how BAN-1 went red on 2026-09-23.
    expect(routeFor('buddy', running)).not.toBe('worker-input')
    expect(routeFor('buddy', runningAndTalking)).not.toBe('worker-input')
  })

  it('reaches Buddy while a worker runs, which was the whole complaint', () => {
    expect(routeFor('buddy', running)).toBe('buddy-start')
    expect(routeFor('buddy', runningAndTalking)).toBe('buddy-continue')
  })

  it('continues an open conversation with Buddy rather than starting a second', () => {
    expect(routeFor('buddy', talking)).toBe('buddy-continue')
    expect(routeFor('buddy', idle)).toBe('buddy-start')
  })

  it('falls back to Buddy when the reader addresses a worker that is not there', () => {
    // The control can be left on Worker when the worker finishes. A message with
    // nowhere to go is worse than one that goes somewhere and says so.
    expect(routeFor('worker', idle)).toBe('buddy-start')
  })

  it('says when the worker cannot be addressed, so the control can show it', () => {
    expect(canAddressWorker(running)).toBe(true)
    expect(canAddressWorker(idle)).toBe(false)
  })
})
