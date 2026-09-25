import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ThreadTab, asOfLine, descentIdFor, parseCardIds } from './ThreadTab'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

describe('the one view this tab shows', () => {
  // Rik's ruling on 2026-09-25, after the twelfth cold run: one view, Loupe's thread
  // with the rail, for this card's ids. No Field, no Descent, no sub-tab row; the
  // Descent is out while it is reworked in Loupe.
  //
  // The tests replaced here asserted the sub-tab row's own behaviour: which lens each
  // sent, that Field sent no id and Descent did, and that the row read Field and
  // Descent. There is no row now, so they are replaced in the place they stood rather
  // than deleted, and what stands instead is the single view's own contract.

  beforeEach(() => {
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

  it('has no sub-tab row at all', async () => {
    renderTab()
    await frameReady()
    expect(screen.queryByTestId('thread-lens-list')).toBeNull()
    expect(screen.queryByTestId('thread-lens-descent')).toBeNull()
    expect(screen.queryByText('Field')).toBeNull()
    expect(screen.queryByText('Descent')).toBeNull()
  })

  it('asks for lens=list, which is the lens the rail is drawn over', async () => {
    // Not because the field is wanted: an ?id= draws that row's thread on top of it.
    // Loupe has no lens called thread and silently ignores one, which this tab has
    // been caught sending once already.
    const { container } = renderTab()
    await frameReady()
    expect(paramsOf(container).get('lens')).toBe('list')
  })

  it('asks for field=0, so Loupe offers no way back to a field this tab has not got', async () => {
    const { container } = renderTab()
    await frameReady()
    expect(paramsOf(container).get('field')).toBe('0')
  })

  it('always sends an id, because an id is what opens the rail', async () => {
    const { container } = renderTab()
    await frameReady()
    expect(paramsOf(container).get('id')).toBe('US-UI-10')
  })

  it('opens on the first id listed when the card names no story', async () => {
    const { container } = renderTab({ description: 'ids: AC-UI-30, FR-UI-10' })
    await frameReady()
    expect(paramsOf(container).get('id')).toBe('AC-UI-30')
  })

  it('still narrows the rows to the card, so the rail is this card and not the tree', async () => {
    const { container } = renderTab()
    await frameReady()
    expect(paramsOf(container).get('ids')).toBe('US-UI-10,FR-UI-10,AC-UI-10,AC-UI-20,AC-UI-30')
  })

  it('sends no id for a card that names none, which is Loupe resting where it rests', async () => {
    const { container } = renderTab({ description: 'no ids here' })
    await frameReady()
    expect(paramsOf(container).get('id')).toBeNull()
  })
})

describe('the ids line is the picker', () => {
  // It used to say "5 ids on this card", which is a count of the very thing the reader
  // wants to choose between. The rail shows one id at a time, so the line that said how
  // many there were is where choosing belongs. Nothing was added above the frame.
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generatedAt: '2026-09-25T10:00:00.000Z', worktreeHead: 'e'.repeat(40) }),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  const idOf = (container: HTMLElement) =>
    new URLSearchParams(
      ((container.querySelector('[data-testid="thread-frame"]') as HTMLIFrameElement).src)
        .split('?')[1] ?? '',
    ).get('id')

  const marked = () =>
    [...screen.getByTestId('thread-id-picker').querySelectorAll('button')]
      .filter(b => b.getAttribute('aria-current') === 'true')
      .map(b => b.textContent)

  const frameReady = () =>
    waitFor(() => expect(screen.getByTestId('thread-frame')).toBeTruthy())

  it('lists every id on the card, in card order', async () => {
    renderTab()
    await frameReady()
    const labels = [...screen.getByTestId('thread-id-picker').querySelectorAll('button')]
      .map(b => b.textContent)
    expect(labels).toEqual(['US-UI-10', 'FR-UI-10', 'AC-UI-10', 'AC-UI-20', 'AC-UI-30'])
  })

  it('marks the one the rail is open on, and only that one', async () => {
    renderTab()
    await frameReady()
    expect(marked()).toEqual(['US-UI-10'])
  })

  it('reloads the frame on that id when one is clicked', async () => {
    const { container } = renderTab()
    await frameReady()
    expect(idOf(container)).toBe('US-UI-10')

    fireEvent.click(screen.getByTestId('thread-id-AC-UI-20'))
    expect(idOf(container)).toBe('AC-UI-20')
    expect(marked()).toEqual(['AC-UI-20'])
  })

  it('keeps the lens, the flag and the ids across a pick, so only the id moves', async () => {
    const { container } = renderTab()
    await frameReady()
    fireEvent.click(screen.getByTestId('thread-id-AC-UI-10'))
    const params = new URLSearchParams(
      ((container.querySelector('[data-testid="thread-frame"]') as HTMLIFrameElement).src)
        .split('?')[1] ?? '',
    )
    expect(params.get('lens')).toBe('list')
    expect(params.get('field')).toBe('0')
    expect(params.get('ids')).toBe('US-UI-10,FR-UI-10,AC-UI-10,AC-UI-20,AC-UI-30')
  })

  it('says so plainly when the card names no ids, rather than drawing an empty picker', async () => {
    renderTab({ description: 'no ids here' })
    await frameReady()
    expect(screen.getByTestId('thread-id-picker').querySelectorAll('button').length).toBe(0)
    expect(screen.getByText(/no ids: line on this card/)).toBeTruthy()
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

describe('the chosen id belongs to the card, not to the panel', () => {
  // The card pane is a singleton: __root.tsx renders one <TicketDetailPanel /> with no
  // key, and the card it shows comes from the store. Opening a second card changes
  // props and remounts nothing, so this component's own state outlived the card it was
  // chosen on, and the next card's Thread tab opened on the last card's choice before
  // anybody had touched anything. On the eleventh cold run of Bang that state was the
  // sub-tab; it is the chosen id now, and it would outlive a card the same way.
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generatedAt: '2026-09-25T10:00:00.000Z', worktreeHead: 'e'.repeat(40) }),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  const srcOf = (container: HTMLElement) =>
    (container.querySelector('[data-testid="thread-frame"]') as HTMLIFrameElement | null)?.src ?? ''

  it("opens on the card's story again on a fresh mount, after another id was picked", async () => {
    const first = renderTab()
    await waitFor(() => expect(screen.getByTestId('thread-frame')).toBeTruthy())
    fireEvent.click(screen.getByTestId('thread-id-AC-UI-20'))
    expect(new URLSearchParams(srcOf(first.container).split('?')[1]).get('id')).toBe('AC-UI-20')

    // What a key on the ticket id buys: the next card gets a new component, so the
    // rail opens on that card's story rather than on the last card's pick. The state
    // that used to outlive the card was the sub-tab; it is the chosen id now, and it
    // would outlive it exactly the same way.
    cleanup()
    const second = renderTab()
    await waitFor(() => expect(screen.getByTestId('thread-frame')).toBeTruthy())
    const params = new URLSearchParams(srcOf(second.container).split('?')[1])
    expect(params.get('id')).toBe('US-UI-10')
  })

  it('is keyed by the card where it is used, so the panel cannot hold the sub-tab', () => {
    // Read out of the caller rather than restated: the guarantee above is only true
    // while the key is there, and the key is in a different file from this component.
    const panel = readFileSync(
      join(__dirname, 'TicketDetailPanel.tsx'), 'utf8')
    const call = panel.slice(panel.indexOf('<ThreadTab'))
    expect(call.slice(0, call.indexOf('/>'))).toMatch(/key=\{ticket\.id\}/)
  })
})
