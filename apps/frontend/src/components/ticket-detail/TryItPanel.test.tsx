import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { TryItPanel } from './TryItPanel'

/**
 * Try it, on a card that built a screen.
 *
 * try.sh starts the app on a free loopback port and prints the link. The panel showed
 * it inside a block of monospaced transcript, so a reader had to find it, select it
 * without catching the surrounding text, and paste it. The link is the point of
 * pressing the button on a card that built a screen.
 */
const WEB_TRANSCRIPT = [
  'Starting the web app from this branch on a free loopback port.',
  '',
  '    http://127.0.0.1:52341/return/1',
  '',
  'It is answering. The link is live for 30 minutes.',
].join('\n')

const COMMAND_TRANSCRIPT = [
  'No screen; try: lend list',
  '$ lend list',
  '  Ladder\tSam\t2026-01-05',
].join('\n')

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client }, children)
}

const respondWith = (stdout: string) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ran: true, exitCode: 0, stdout, stderr: '', script: 'scripts/try.sh' }),
    }),
  )
}

describe('Try it', () => {
  let opened: ReturnType<typeof vi.fn>

  beforeEach(() => {
    opened = vi.fn()
    vi.stubGlobal('open', opened)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('opens the link in a new tab, not in a frame', async () => {
    // A new tab because the app has text fields and a file input, and a framed app is
    // an app whose inputs behave differently for reasons nobody can see.
    respondWith(WEB_TRANSCRIPT)
    render(<TryItPanel projectId="bang" ticketId="BAN-1" />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /try it/i }))

    await waitFor(() => expect(opened).toHaveBeenCalled())
    expect(opened.mock.calls[0][0]).toBe('http://127.0.0.1:52341/return/1')
    expect(opened.mock.calls[0][1]).toBe('_blank')
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('keeps the transcript in the panel', async () => {
    respondWith(WEB_TRANSCRIPT)
    render(<TryItPanel projectId="bang" ticketId="BAN-1" />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /try it/i }))

    await waitFor(() => expect(screen.getByTestId('try-open-link')).toBeTruthy())
    expect(screen.getByText(/It is answering/)).toBeTruthy()
    expect(screen.getByText('Exited 0.')).toBeTruthy()
  })

  it('leaves the link on the page, so a blocked popup is still reachable', async () => {
    // window.open can be refused. The reader still has the link, as a link.
    respondWith(WEB_TRANSCRIPT)
    render(<TryItPanel projectId="bang" ticketId="BAN-1" />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /try it/i }))

    await waitFor(() => expect(screen.getByTestId('try-open-link')).toBeTruthy())
    const link = screen.getByRole('link') as HTMLAnchorElement
    expect(link.href).toBe('http://127.0.0.1:52341/return/1')
    expect(link.target).toBe('_blank')
    expect(link.rel).toContain('noopener')
  })

  it('opens nothing for a command transcript, which is most cards', async () => {
    respondWith(COMMAND_TRANSCRIPT)
    render(<TryItPanel projectId="bang" ticketId="BAN-1" />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /try it/i }))

    await waitFor(() => expect(screen.getByText('Exited 0.')).toBeTruthy())
    expect(opened).not.toHaveBeenCalled()
    expect(screen.queryByTestId('try-open-link')).toBeNull()
    expect(screen.getByText(/lend list/)).toBeTruthy()
  })

  it('opens the link once, not on every render', async () => {
    respondWith(WEB_TRANSCRIPT)
    const { rerender } = render(<TryItPanel projectId="bang" ticketId="BAN-1" />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /try it/i }))
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1))

    rerender(<TryItPanel projectId="bang" ticketId="BAN-1" />)
    expect(opened).toHaveBeenCalledTimes(1)
  })
})
