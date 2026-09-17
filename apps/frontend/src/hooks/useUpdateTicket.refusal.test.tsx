import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const toastError = vi.fn()
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }))

import { useUpdateTicket } from './queries'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useUpdateTicket when the daemon refuses a move', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    toastError.mockReset()
  })

  it("shows the daemon's refusal message, the one an entry check writes", async () => {
    const body = {
      error: 'Entry check refused',
      message: 'Move to Done refused: entry check exited 1\nPR #35 is not merged into main',
      phase: 'Done',
    }
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status: 409 })))

    const { result } = renderHook(() => useUpdateTicket(), { wrapper })
    result.current.mutate({ projectId: 'p', ticketId: 'CHA-99', updates: { phase: 'Done' } })

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1))
    expect(toastError).toHaveBeenCalledWith(body.message)
  })

  it('shows nothing when the move goes through', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'CHA-99', phase: 'Done' }), { status: 200 })))

    const { result } = renderHook(() => useUpdateTicket(), { wrapper })
    result.current.mutate({ projectId: 'p', ticketId: 'CHA-99', updates: { phase: 'Done' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toastError).not.toHaveBeenCalled()
  })
})
