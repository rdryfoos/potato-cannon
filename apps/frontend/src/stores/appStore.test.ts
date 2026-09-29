import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useAppStore } from './appStore'

describe('appStore - pendingTickets', () => {
  beforeEach(() => {
    useAppStore.setState({
      pendingTickets: new Map(),
    })
  })

  it('should return false for non-pending ticket', () => {
    const result = useAppStore.getState().isTicketPending('proj-1', 'ticket-1')
    expect(result).toBe(false)
  })

  it('should add a pending ticket', () => {
    useAppStore.getState().addPendingTicket('proj-1', 'ticket-1')
    expect(useAppStore.getState().isTicketPending('proj-1', 'ticket-1')).toBe(true)
  })

  it('should not affect other tickets when adding', () => {
    useAppStore.getState().addPendingTicket('proj-1', 'ticket-1')
    expect(useAppStore.getState().isTicketPending('proj-1', 'ticket-2')).toBe(false)
  })

  it('should not affect other projects when adding', () => {
    useAppStore.getState().addPendingTicket('proj-1', 'ticket-1')
    expect(useAppStore.getState().isTicketPending('proj-2', 'ticket-1')).toBe(false)
  })

  it('should remove a pending ticket', () => {
    useAppStore.getState().addPendingTicket('proj-1', 'ticket-1')
    useAppStore.getState().removePendingTicket('proj-1', 'ticket-1')
    expect(useAppStore.getState().isTicketPending('proj-1', 'ticket-1')).toBe(false)
  })

  it('should set pending tickets for a project (replacing existing)', () => {
    useAppStore.getState().addPendingTicket('proj-1', 'ticket-old')
    useAppStore.getState().setPendingTickets('proj-1', ['ticket-1', 'ticket-2'])

    expect(useAppStore.getState().isTicketPending('proj-1', 'ticket-1')).toBe(true)
    expect(useAppStore.getState().isTicketPending('proj-1', 'ticket-2')).toBe(true)
    expect(useAppStore.getState().isTicketPending('proj-1', 'ticket-old')).toBe(false)
  })

  it('should handle removing from non-existent project gracefully', () => {
    useAppStore.getState().removePendingTicket('nonexistent', 'ticket-1')
    expect(useAppStore.getState().isTicketPending('nonexistent', 'ticket-1')).toBe(false)
  })
})

describe('appStore - ticketActivity', () => {
  beforeEach(() => {
    useAppStore.setState({
      ticketActivity: new Map(),
    })
  })

  it('should return undefined for ticket with no activity', () => {
    const result = useAppStore.getState().getTicketActivity('proj-1', 'ticket-1')
    expect(result).toBeUndefined()
  })

  it('should set activity for a ticket', () => {
    useAppStore.getState().setTicketActivity('proj-1', 'ticket-1', 'Reading documentation')
    expect(useAppStore.getState().getTicketActivity('proj-1', 'ticket-1')).toBe('Reading documentation')
  })

  it('should not affect other tickets when setting activity', () => {
    useAppStore.getState().setTicketActivity('proj-1', 'ticket-1', 'Reading documentation')
    expect(useAppStore.getState().getTicketActivity('proj-1', 'ticket-2')).toBeUndefined()
  })

  it('should not affect other projects when setting activity', () => {
    useAppStore.getState().setTicketActivity('proj-1', 'ticket-1', 'Reading documentation')
    expect(useAppStore.getState().getTicketActivity('proj-2', 'ticket-1')).toBeUndefined()
  })

  it('should update activity for the same ticket', () => {
    useAppStore.getState().setTicketActivity('proj-1', 'ticket-1', 'Reading documentation')
    useAppStore.getState().setTicketActivity('proj-1', 'ticket-1', 'Making code changes')
    expect(useAppStore.getState().getTicketActivity('proj-1', 'ticket-1')).toBe('Making code changes')
  })

  it('should clear activity for a ticket', () => {
    useAppStore.getState().setTicketActivity('proj-1', 'ticket-1', 'Reading documentation')
    useAppStore.getState().clearTicketActivity('proj-1', 'ticket-1')
    expect(useAppStore.getState().getTicketActivity('proj-1', 'ticket-1')).toBeUndefined()
  })

  it('should handle clearing from non-existent project gracefully', () => {
    useAppStore.getState().clearTicketActivity('nonexistent', 'ticket-1')
    expect(useAppStore.getState().getTicketActivity('nonexistent', 'ticket-1')).toBeUndefined()
  })

  it('should track activity independently across multiple projects', () => {
    useAppStore.getState().setTicketActivity('proj-1', 'ticket-1', 'Reading documentation')
    useAppStore.getState().setTicketActivity('proj-2', 'ticket-1', 'Making code changes')
    expect(useAppStore.getState().getTicketActivity('proj-1', 'ticket-1')).toBe('Reading documentation')
    expect(useAppStore.getState().getTicketActivity('proj-2', 'ticket-1')).toBe('Making code changes')
  })
})

describe('appStore - composerDrafts', () => {
  beforeEach(() => {
    useAppStore.setState({
      composerDrafts: new Map(),
    })
  })

  it('should return undefined for a card with nothing typed', () => {
    expect(useAppStore.getState().getComposerDraft('proj-1', 'ticket-1')).toBeUndefined()
  })

  it('should hold what was typed on a card', () => {
    useAppStore.getState().setComposerDraft('proj-1', 'ticket-1', 'why does this need a nav bar')
    expect(useAppStore.getState().getComposerDraft('proj-1', 'ticket-1'))
      .toBe('why does this need a nav bar')
  })

  it('should keep one card’s draft off another card', () => {
    useAppStore.getState().setComposerDraft('proj-1', 'ticket-1', 'for card one')
    useAppStore.getState().setComposerDraft('proj-1', 'ticket-2', 'for card two')
    useAppStore.getState().setComposerDraft('proj-2', 'ticket-1', 'another project')
    expect(useAppStore.getState().getComposerDraft('proj-1', 'ticket-1')).toBe('for card one')
    expect(useAppStore.getState().getComposerDraft('proj-1', 'ticket-2')).toBe('for card two')
    expect(useAppStore.getState().getComposerDraft('proj-2', 'ticket-1')).toBe('another project')
  })

  it('should clear one card without touching its neighbours', () => {
    useAppStore.getState().setComposerDraft('proj-1', 'ticket-1', 'sent now')
    useAppStore.getState().setComposerDraft('proj-1', 'ticket-2', 'still typing')
    useAppStore.getState().clearComposerDraft('proj-1', 'ticket-1')
    expect(useAppStore.getState().getComposerDraft('proj-1', 'ticket-1')).toBeUndefined()
    expect(useAppStore.getState().getComposerDraft('proj-1', 'ticket-2')).toBe('still typing')
  })

  it('should handle clearing a project it has never seen', () => {
    expect(() => useAppStore.getState().clearComposerDraft('nobody', 'ticket-1')).not.toThrow()
  })

  it('should not be persisted: a draft survives a tab switch, not a reload', () => {
    // `partialize` is the whole of what localStorage gets. A half-written question that
    // came back three days later, on a card whose answer had long since arrived, would
    // be worse than an empty box, and nothing asked for it.
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'appStore.ts'), 'utf-8')
    const partialize = source.split('partialize:')[1].split('}')[0]
    expect(partialize).not.toContain('composerDrafts')
  })
})
