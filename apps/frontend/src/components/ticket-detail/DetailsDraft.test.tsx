/**
 * An unsaved Details edit is not lost by a tab switch or a drag.
 *
 * Rik typed his first Rework block into Details, dragged the card, and the text was gone
 * with nothing said about it. Two things destroy this component and either one did it:
 * the panel's tabs are Radix `TabsContent` with no `forceMount`, so opening Agents
 * unmounts Details outright, and a drag refetches the card. The edit was `useState`.
 *
 * It is in the store now, keyed by project and card, so the text survives both, and the
 * heading says "unsaved" while it differs from what the card holds. The real store is
 * used here, not a mock, because the store is the thing under test.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/appStore'
import { DetailsTab } from './DetailsTab'

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

const DESCRIPTION = 'ids: US-UI-10\nbranch: potato/BAN-1\n\nThe story as the card holds it.'

function Panel({ ticketId = 'POT-1' }: { ticketId?: string }) {
  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="activity">Agents</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <DetailsTab projectId="test-project" ticketId={ticketId} description={DESCRIPTION} />
      </TabsContent>
      <TabsContent value="activity">
        <div>the agents pane</div>
      </TabsContent>
    </Tabs>
  )
}

// Radix selects a tab on mousedown, not on click.
const switchTo = (label: string) =>
  fireEvent.mouseDown(screen.getByRole('tab', { name: label }))

const editor = () =>
  screen.getByPlaceholderText('Enter ticket description (supports markdown)...')

const REWORK = '<!-- rework:begin -->\nUse the item name, not the id.\n<!-- rework:end -->'

describe('an unsaved Details edit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.setState({ detailsDrafts: new Map() })
  })
  afterEach(cleanup)

  it('is still there after Agents and back, with the editor still open', () => {
    render(<Panel />)
    fireEvent.click(screen.getByTestId('details-edit'))
    fireEvent.change(editor(), { target: { value: REWORK } })

    switchTo('Agents')
    expect(screen.getByText('the agents pane')).toBeTruthy()

    switchTo('Details')
    expect((editor() as HTMLTextAreaElement).value).toBe(REWORK)
  })

  it('says it is unsaved rather than looking saved', () => {
    render(<Panel />)
    fireEvent.click(screen.getByTestId('details-edit'))
    expect(screen.queryByTestId('details-unsaved')).toBeNull()

    fireEvent.change(editor(), { target: { value: REWORK } })
    expect(screen.getByTestId('details-unsaved')).toBeTruthy()
  })

  it('survives the panel being destroyed entirely, which is what a drag does', () => {
    const first = render(<Panel />)
    fireEvent.click(screen.getByTestId('details-edit'))
    fireEvent.change(editor(), { target: { value: REWORK } })
    first.unmount()

    render(<Panel />)
    expect((editor() as HTMLTextAreaElement).value).toBe(REWORK)
    expect(screen.getByTestId('details-unsaved')).toBeTruthy()
  })

  it('does not carry one card’s draft onto another card', () => {
    const { rerender } = render(<Panel ticketId="POT-1" />)
    fireEvent.click(screen.getByTestId('details-edit'))
    fireEvent.change(editor(), { target: { value: REWORK } })

    rerender(<Panel ticketId="POT-2" />)
    expect(screen.queryByPlaceholderText(
      'Enter ticket description (supports markdown)...')).toBeNull()
  })

  it('is gone once the hand cancels, and the card is unchanged', () => {
    render(<Panel />)
    fireEvent.click(screen.getByTestId('details-edit'))
    fireEvent.change(editor(), { target: { value: REWORK } })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockMutate).not.toHaveBeenCalled()
    expect(useAppStore.getState().getDetailsDraft('test-project', 'POT-1')).toBeUndefined()
  })
})

describe('the story and the record', () => {
  // Details showed the description in storage order, so the first thing on opening a
  // card was four lines of SHAs. The story is first now; the record folds under it.
  const WITH_RECORD = [
    'ids: US-UI-10',
    'branch: potato/BAN-1',
    '',
    'The story a person wrote.',
  ].join('\n')

  function Panel2({ description = WITH_RECORD }: { description?: string }) {
    return (
      <DetailsTab projectId="test-project" ticketId="POT-9" description={description} />
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.setState({ detailsDrafts: new Map() })
  })
  afterEach(cleanup)

  it('shows the story and not the record lines, until the record is opened', () => {
    render(<Panel2 />)
    expect(screen.getByText('The story a person wrote.')).toBeTruthy()
    expect(screen.queryByTestId('record-body')).toBeNull()
    expect(screen.queryByText('potato/BAN-1')).toBeNull()
  })

  it('says how much is folded away, so the control is not a mystery', () => {
    render(<Panel2 />)
    expect(screen.getByTestId('record-toggle').textContent).toContain('2 lines')
  })

  it('opens the record on one control, and the lines are there', () => {
    render(<Panel2 />)
    fireEvent.click(screen.getByTestId('record-toggle'))
    expect(screen.getByTestId('record-body')).toBeTruthy()
    expect(screen.getByText('potato/BAN-1')).toBeTruthy()
    expect(screen.getByText('US-UI-10')).toBeTruthy()
  })

  it('closes again on the same control', () => {
    render(<Panel2 />)
    fireEvent.click(screen.getByTestId('record-toggle'))
    fireEvent.click(screen.getByTestId('record-toggle'))
    expect(screen.queryByTestId('record-body')).toBeNull()
  })

  it('does not change the record, only where it sits', () => {
    // The card is untouched: nothing here writes.
    render(<Panel2 />)
    fireEvent.click(screen.getByTestId('record-toggle'))
    expect(mockMutate).not.toHaveBeenCalled()
  })
})
