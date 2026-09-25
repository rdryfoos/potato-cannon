import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { ThreadTab, asOfLine, descentIdFor, parseCardIds } from './ThreadTab'

/** BAN-1's own ids line, story first, as the daemon stores it. */
const BAN_1_IDS = 'ids: US-UI-10, FR-UI-10, AC-UI-10, AC-UI-20, AC-UI-30'

function renderTab(props: { description?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return render(
    <ThreadTab
      projectId="bang"
      ticketId="BAN-1"
      description={props.description ?? BAN_1_IDS}
      title="Lend and return in the browser"
    />,
    { wrapper },
  )
}

describe('the card lens: a card names its own ids', () => {
  it('reads the ids line a real card carries', () => {
    // BAN-1's own description, as the daemon stores it.
    const description =
      'ids: US-LEND-10, FR-LEND-10, AC-LEND-10, AC-LEND-20, NFR-PRIV-10, AC-PRIV-20, AC-PRIV-10'
    expect(parseCardIds(description)).toEqual([
      'US-LEND-10',
      'FR-LEND-10',
      'AC-LEND-10',
      'AC-LEND-20',
      'NFR-PRIV-10',
      'AC-PRIV-20',
      'AC-PRIV-10',
    ])
  })

  it('finds the line wherever it sits in the description', () => {
    const description = [
      'Lend and return in the browser.',
      '',
      'ids: US-UI-10, FR-UI-10',
      '',
      'Read design/README.md first.',
    ].join('\n')
    expect(parseCardIds(description)).toEqual(['US-UI-10', 'FR-UI-10'])
  })

  it('takes the first ids line only, so a card cannot quietly carry two lenses', () => {
    const description = 'ids: US-UI-10\nids: NFR-PRIV-10'
    expect(parseCardIds(description)).toEqual(['US-UI-10'])
  })

  it('tolerates the spacing and casing a person actually types', () => {
    expect(parseCardIds('  IDs:US-UI-10 ,  FR-UI-10 ,')).toEqual(['US-UI-10', 'FR-UI-10'])
  })

  it('gives no ids for a card that never named any', () => {
    // Not an error: a card with no ids line is a card nobody has decided the
    // promises for yet, and the tab shows the whole manifest.
    expect(parseCardIds('Just a card, no ids here.')).toEqual([])
    expect(parseCardIds('')).toEqual([])
    expect(parseCardIds(undefined)).toEqual([])
  })

  it('does not mistake prose that merely mentions ids for the line', () => {
    // The line has to start with it. Prose about the ids line is not one.
    expect(parseCardIds('The ids: line is missing on purpose.')).toEqual([])
  })
})

describe('the as of line: which picture this is', () => {
  // The tab reads the worktree's manifest live off disk, so it shows whatever the last
  // Gate run in that worktree left. On 2026-09-21 a Thread Report eight hours stale and
  // from another board read exactly like a current one. The line is the fix, and these
  // assert it says both halves and never invents either.
  it('names the time it was generated and the commit it describes', () => {
    const line = asOfLine('2026-09-23T14:05:00.000Z', '8c1f4a2d9e7b6a5c4d3e2f1a0b9c8d7e6f5a4b3c')
    expect(line).toContain('8c1f4a2')
    expect(line).toMatch(/^as of .+, worktree at 8c1f4a2$/)
  })

  it('shortens the commit to seven characters, the length a reader can carry', () => {
    const line = asOfLine('2026-09-23T14:05:00.000Z', 'abcdef1234567890abcdef1234567890abcdef12')
    expect(line).toContain('worktree at abcdef1')
    expect(line).not.toContain('abcdef1234567890')
  })

  it('says the commit is unknown rather than showing nothing', () => {
    // A card with no commits yet has no HEAD. Saying so is not the same as a line that
    // quietly leaves the commit out, which reads as though there were none to give.
    expect(asOfLine('2026-09-23T14:05:00.000Z', null)).toContain('worktree commit unknown')
  })

  it('says the time is unrecorded rather than printing a broken date', () => {
    expect(asOfLine(null, '8c1f4a2d9e7b6a5c4d3e2f1a0b9c8d7e6f5a4b3c')).toBe(
      'as of an unrecorded time, worktree at 8c1f4a2',
    )
  })

  it('still says both halves when it knows neither', () => {
    expect(asOfLine(null, null)).toBe('as of an unrecorded time, worktree commit unknown')
  })
})

describe('which view the tab asks Loupe for', () => {
  // It asked for `?lens=thread`, and Loupe has no lens called thread: main.ts accepts
  // "list", "map" or "descent" and silently ignores anything else, so the tab set
  // nothing and Loupe stayed on its default, the list. The tab said Thread and drew the
  // field, and had done since the toggle was added. The Descent view had a second
  // problem: Loupe rests closed without an `?id=`, so setting the lens alone still drew
  // the field.
  const LOUPE_LENSES = ['list', 'map', 'descent']

  beforeEach(() => {
    // The tab asks the daemon whether the card has a manifest before it mounts the
    // frame. Present, so the frame is rendered and its src can be read.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generatedAt: '2026-09-25T10:00:00.000Z', worktreeHead: 'e'.repeat(40) }),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  const frameReady = () =>
    waitFor(() => expect(screen.getByTestId('thread-frame')).toBeTruthy())

  const src = (container: HTMLElement) =>
    (container.querySelector('[data-testid="thread-frame"]') as HTMLIFrameElement | null)?.src ?? ''

  const paramsOf = (container: HTMLElement) =>
    new URLSearchParams(src(container).split('?')[1] ?? '')

  it('asks for a lens Loupe actually has', async () => {
    const { container } = renderTab()
    await frameReady()
    const lens = paramsOf(container).get('lens')
    expect(LOUPE_LENSES).toContain(lens)
  })

  it('never sends "thread" as a lens, under either sub-tab', async () => {
    const { container } = renderTab()
    await frameReady()
    expect(paramsOf(container).get('lens')).not.toBe('thread')
    expect(src(container)).not.toContain('lens=thread')

    fireEvent.click(screen.getByTestId('thread-lens-descent'))
    expect(paramsOf(container).get('lens')).not.toBe('thread')
    expect(src(container)).not.toContain('lens=thread')
  })

  it('asks for the descent when the Descent sub-tab is chosen', async () => {
    const { container } = renderTab()
    await frameReady()
    fireEvent.click(screen.getByTestId('thread-lens-descent'))
    expect(paramsOf(container).get('lens')).toBe('descent')
  })

  // The ninth cold run (panda) read this off the screen: Field showed one thread,
  // US-UI-10, under Loupe's own "Back to field" button. The tab was sending `id` under
  // both sub-tabs, and the test below used to assert exactly that, from the default
  // sub-tab, which is Field. It called what it saw "so the descent opens" and so read
  // as a test of Descent while standing in Field.
  //
  // Loupe reads the id before it reads the lens: `descentOpen = !!deepLinkId`
  // (main.ts around 431), and the embed shell draws `renderDescent(selected)` for any
  // lens once something is open. An id is therefore not a hint about which row to
  // highlight. It is the thing that closes the field.
  it('sends no id under Field, which is what rests Loupe on the strand field', async () => {
    const { container } = renderTab()
    await frameReady()
    expect(paramsOf(container).get('lens')).toBe('list')
    expect(paramsOf(container).get('id')).toBeNull()
    expect([...paramsOf(container).keys()]).not.toContain('id')
  })

  it('sends an id under Descent, because there the id is the subject', async () => {
    const { container } = renderTab()
    await frameReady()
    fireEvent.click(screen.getByTestId('thread-lens-descent'))
    expect(paramsOf(container).get('lens')).toBe('descent')
    expect(paramsOf(container).get('id')).toBe('US-UI-10')
  })

  it('keeps the card ids under both, because that lens is not the open flag', async () => {
    // `ids` narrows which rows exist; `id` picks one and opens it. Field needs the
    // first and must not have the second, and the difference is the whole of this fix.
    const { container } = renderTab()
    await frameReady()
    const all = 'US-UI-10,FR-UI-10,AC-UI-10,AC-UI-20,AC-UI-30'
    expect(paramsOf(container).get('ids')).toBe(all)
    fireEvent.click(screen.getByTestId('thread-lens-descent'))
    expect(paramsOf(container).get('ids')).toBe(all)
  })

  it('sends no id for a card that names none, under either sub-tab', async () => {
    const { container } = renderTab({ description: 'no ids here' })
    await frameReady()
    expect(paramsOf(container).get('id')).toBeNull()
    fireEvent.click(screen.getByTestId('thread-lens-descent'))
    expect(paramsOf(container).get('id')).toBeNull()
  })

  it('leaves the frame unsandboxed, so a click inside the Field still opens a descent', async () => {
    // Per-thread descent is Loupe's own and needs no bridge: a strand click runs
    // `selectedId = id; descentOpen = true; render()` inside the frame (main.ts around
    // 1564), and Loupe's "Back to field" brings the reader out again. Nothing here
    // blocks it today, and this says so out loud, because a `sandbox` attribute added
    // later for the look of it would take that handler's scripting away and the Field
    // would go dead with nothing on screen to explain it.
    const { container } = renderTab()
    await frameReady()
    const frame = container.querySelector('[data-testid="thread-frame"]') as HTMLIFrameElement
    expect(frame.hasAttribute('sandbox')).toBe(false)
    expect(frame.getAttribute('src')).toMatch(/^\/loupe\/index\.html\?/)
  })

  it('calls the list view what Loupe calls it', async () => {
    // Loupe's own back control says "Back to field". One name per thing.
    renderTab()
    await frameReady()
    expect(screen.getByTestId('thread-lens-list').textContent).toBe('Field')
    expect(screen.getByTestId('thread-lens-descent').textContent).toBe('Descent')
    expect(screen.queryByText('Thread')).toBeNull()
  })
})

describe('which id the descent opens on', () => {
  // A descent opened on a story is the whole card's strand; one opened on a criterion
  // is a twig of it. The ids come from the same ids: line the lens comes from.
  it("opens on the card's story when it has one", () => {
    expect(descentIdFor(['US-UI-10', 'FR-UI-10', 'AC-UI-10'])).toBe('US-UI-10')
  })

  it('finds the story wherever it sits on the line', () => {
    expect(descentIdFor(['AC-UI-10', 'US-UI-10'])).toBe('US-UI-10')
  })

  it('opens on the first id listed when the card names no story', () => {
    expect(descentIdFor(['NFR-ENG-10', 'AC-ENG-10'])).toBe('NFR-ENG-10')
  })

  it('opens on nothing for a card that names no ids, which rests on the field', () => {
    expect(descentIdFor([])).toBeNull()
  })
})
