import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock appStore before importing useSSE
vi.mock('@/stores/appStore', () => ({
  useAppStore: (selector: any) => {
    const state = {
      setProcessingTickets: vi.fn(),
      removeProcessingTicket: vi.fn(),
      setPendingTickets: vi.fn(),
      addPendingTicket: vi.fn(),
      removePendingTicket: vi.fn(),
      setTicketActivity: vi.fn(),
      clearTicketActivity: vi.fn(),
    }
    return selector(state)
  },
}))

vi.mock('@/lib/utils', () => ({
  formatToolActivity: vi.fn(() => 'doing something'),
}))

import { useSSE } from './useSSE'

describe('useSSE - session:ended brainstorm refetch', () => {
  let queryClient: QueryClient
  let eventListeners: Record<string, Function>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.spyOn(queryClient, 'refetchQueries')

    eventListeners = {}

    class MockEventSource {
      addEventListener(event: string, handler: Function) {
        eventListeners[event] = handler
      }
      close() {}
      onopen: any = null
      onerror: any = null
    }

    vi.stubGlobal('EventSource', MockEventSource as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('refetches brainstorms query on session:ended', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    renderHook(() => useSSE(), { wrapper })

    // Simulate session:ended event
    const sessionEndedHandler = eventListeners['session:ended']
    expect(sessionEndedHandler).toBeDefined()

    sessionEndedHandler({ data: JSON.stringify({ projectId: 'p1', ticketId: 't1' }) })

    expect(queryClient.refetchQueries).toHaveBeenCalledWith({ queryKey: ['brainstorms'] })
  })
})

describe('useSSE - the open card refetches itself', () => {
  // The card panel reads ['ticket', projectId, ticketId]; the board reads ['tickets'].
  // Every ticket event refetched the board and left the panel alone, so a reader
  // watching a card run saw nothing change until they pressed Cmd-R. These assert the
  // single-card key is refetched by every event that can change a card, which is the
  // thing nobody could see was missing.
  let queryClient: QueryClient
  let eventListeners: Record<string, Function>

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.spyOn(queryClient, 'refetchQueries')
    eventListeners = {}

    class MockEventSource {
      addEventListener(event: string, handler: Function) {
        eventListeners[event] = handler
      }
      close() {}
      onopen: any = null
      onerror: any = null
    }

    vi.stubGlobal('EventSource', MockEventSource as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mount = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    renderHook(() => useSSE(), { wrapper })
  }

  const payload = JSON.stringify({ projectId: 'p1', ticketId: 't1' })

  it.each([
    'ticket:created',
    'ticket:updated',
    'ticket:moved',
    'ticket:deleted',
    'ticket:restarted',
    'session:started',
    'session:ended',
  ])('refetches the single-card query on %s', (event) => {
    mount()
    const handler = eventListeners[event]
    expect(handler, `${event} has no listener`).toBeDefined()

    handler({ data: payload })

    expect(queryClient.refetchQueries).toHaveBeenCalledWith({ queryKey: ['ticket'] })
  })

  it('still refetches the board list, which is a different key', () => {
    mount()
    eventListeners['ticket:updated']({ data: payload })

    expect(queryClient.refetchQueries).toHaveBeenCalledWith({ queryKey: ['tickets'] })
    expect(queryClient.refetchQueries).toHaveBeenCalledWith({ queryKey: ['ticket'] })
  })
})
