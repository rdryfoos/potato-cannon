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
