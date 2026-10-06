/**
 * The panel remembers the tab, and Details no longer clamps the story.
 *
 * The tab was reset on every card change, to the phase's own default. The intent was
 * good; the effect was that a reader comparing two cards on the same tab reselected it
 * every time they moved between them, and a reader who had opened Details to read a
 * story was put back on a feed.
 *
 * The panel is a singleton, so nothing remounts when the card changes. Removing the
 * reset is the whole of what "persists across cards" needs, and this is what says so.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/appStore'
import { DetailsTab } from './DetailsTab'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

HTMLElement.prototype.scrollIntoView = vi.fn()

const mockMutate = vi.fn()
vi.mock('@/hooks/queries', () => ({
  useUpdateTicket: () => ({ mutate: mockMutate, isPending: false }),
  useTicketArtifacts: () => ({ data: [] }),
  useSessions: () => ({ data: [] }),
  useSessionLog: () => ({ data: null }),
  useProjects: () => ({ data: [] }),
}))
vi.mock('@/lib/markdown', () => ({ renderMarkdown: vi.fn((text: string) => text) }))
vi.mock('./ArtifactViewerFull', () => ({ ArtifactViewerFull: () => null }))
vi.mock('./TaskList', () => ({ TaskList: () => null }))

// Longer than the old clamp's trigger: 200 characters, or more than five lines.
const LONG_STORY = Array.from({ length: 12 }, (_, i) => `Line ${i + 1} of a long story.`).join('\n')

const REFUSED = [
  { phase: 'Build', at: '2026-10-01T09:00:00.000Z' },
  {
    phase: 'Done',
    at: '2026-10-02T09:00:00.000Z',
    reason: 'the Gate has not run on this commit',
    actor: 'hand:rik',
    refused: true as const,
  },
]

function Details({ description = LONG_STORY, history = undefined as typeof REFUSED | undefined }) {
  return (
    <DetailsTab
      projectId="test-project"
      ticketId="POT-1"
      description={description}
      history={history}
    />
  )
}

describe('the story is not clamped any more', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.setState({ detailsDrafts: new Map() })
  })
  afterEach(cleanup)

  it('offers no See more control, however long the story is', () => {
    render(<Details />)
    expect(screen.queryByText('See more')).toBeNull()
    expect(screen.queryByText('Show less')).toBeNull()
  })

  it('does not clamp the story to a height', () => {
    const { container } = render(<Details />)
    expect(container.innerHTML).not.toContain('max-h-[100px]')
    expect(container.innerHTML).not.toContain('overflow-hidden')
  })
})

describe('the refusal block', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.setState({ detailsDrafts: new Map() })
  })
  afterEach(cleanup)

  it('is at the top of Details when the last thing that happened was a refusal', () => {
    render(<Details description="The story." history={REFUSED} />)
    const block = screen.getByTestId('details-refusal')
    expect(block.textContent).toContain('refused entry to Done')
    expect(block.textContent).toContain('the Gate has not run on this commit')
    expect(block.textContent).toContain('hand:rik')
  })

  it('comes before the description, because it is why the card is sitting there', () => {
    const { container } = render(<Details description="The story." history={REFUSED} />)
    const html = container.innerHTML
    expect(html.indexOf('details-refusal')).toBeLessThan(html.indexOf('Description'))
  })

  it('is absent when the card moved after the refusal', () => {
    render(<Details description="The story." history={[
      ...REFUSED,
      { phase: 'Done', at: '2026-10-03T09:00:00.000Z' },
    ]} />)
    expect(screen.queryByTestId('details-refusal')).toBeNull()
  })

  it('is absent for a card that was never refused', () => {
    render(<Details description="The story." history={[{ phase: 'Spec', at: '2026-10-01T09:00:00.000Z' }]} />)
    expect(screen.queryByTestId('details-refusal')).toBeNull()
  })

  it('says when, in a time that will still read the same tomorrow', () => {
    render(<Details description="The story." history={REFUSED} />)
    const block = screen.getByTestId('details-refusal')
    expect(block.textContent).toMatch(/2026/)
    expect(block.textContent).not.toMatch(/ago/)
  })
})

describe('the tab a person chose', () => {
  // The panel is a singleton: one <TicketDetailPanel /> with no key, the card from the
  // store. A card change changes props and remounts nothing, which is why removing the
  // reset is all that is needed. This stands in for that shape.
  function Panel({ ticketId }: { ticketId: string }) {
    return (
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="activity">Agents</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="activity"><div>the agents pane</div></TabsContent>
        <TabsContent value="details"><div>details for {ticketId}</div></TabsContent>
      </Tabs>
    )
  }

  afterEach(cleanup)

  it('survives the card changing under a panel that does not remount', () => {
    // Radix selects on mousedown, not click.
    const { rerender } = render(<Panel ticketId="POT-1" />)
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Agents' }))
    expect(screen.getByText('the agents pane')).toBeTruthy()

    rerender(<Panel ticketId="POT-2" />)
    expect(screen.getByText('the agents pane')).toBeTruthy()
  })
})

describe('the reset that went', () => {
  // Source-reading, because the effect's absence is the change and a component test
  // cannot show a thing not happening as plainly as this does.
  const src = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'TicketDetailPanel.tsx'), 'utf-8')

  it('no longer resets the tab when the card changes', () => {
    expect(src).not.toContain('Reset tab to phase-based default when ticket changes')
    expect(src).not.toMatch(/setActiveTab\(newDefault\)/)
  })

  it('says why it is component state rather than a stored setting', () => {
    expect(src).toContain('The tab a person chose, kept until they choose another.')
  })
})
