/**
 * A draft in the composer survives a tab switch.
 *
 * Rik typed a question to Buddy on a card in Review, went to Details to check
 * something, came back, and the box was empty. Nothing had failed and nothing said so.
 * The Agents tab is a Radix `TabsContent` with no `forceMount`, so showing Details
 * unmounts `ActivityTab` outright, and the draft was a `useState` inside it.
 *
 * This file mounts the real tabs and the real store: no mock of `@/stores/appStore`
 * here, unlike `ActivityTab.test.tsx`, because the store is the thing under test.
 * Clicking the triggers is the unmount, which is what makes this a reproduction rather
 * than an assertion about a function.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/appStore'
import { ActivityTab } from './ActivityTab'

HTMLElement.prototype.scrollIntoView = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: [] as unknown[], isLoading: false })),
  useQueryClient: () => ({ refetchQueries: vi.fn(), setQueryData: vi.fn() }),
}))

vi.mock('@/hooks/useSSE', () => ({
  useSessionOutput: vi.fn(),
  useTicketMessage: vi.fn(),
  useSessionEnded: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  api: {
    getTicketMessages: vi.fn().mockResolvedValue({ messages: [] }),
    respondToQuestion: vi.fn(),
    sendTicketInput: vi.fn().mockResolvedValue({}),
    getTicket: vi.fn().mockResolvedValue({ phase: 'Review' }),
    startTicketChat: vi.fn().mockResolvedValue({ contextId: 'ticketchat_1' }),
    sendTicketChatInput: vi.fn().mockResolvedValue({ ok: true }),
    endTicketChat: vi.fn().mockResolvedValue({ ok: true }),
  },
}))

vi.mock('@/lib/markdown', () => ({ renderMarkdown: vi.fn((text: string) => text) }))
vi.mock('./ArtifactViewerFull', () => ({ ArtifactViewerFull: () => null }))
vi.mock('./TaskList', () => ({ TaskList: () => null }))
vi.mock('./CollapsibleTaskPanel', () => ({ CollapsibleTaskPanel: () => null }))
vi.mock('./RestartPhaseButton', () => ({ RestartPhaseButton: () => null }))

function Panel({ ticketId = 'POT-1' }: { ticketId?: string }) {
  return (
    <Tabs defaultValue="activity">
      <TabsList>
        <TabsTrigger value="activity">Agents</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <TabsContent value="activity">
        <ActivityTab projectId="test-project" ticketId={ticketId} currentPhase="Review" />
      </TabsContent>
      <TabsContent value="details">
        <div>the details pane</div>
      </TabsContent>
    </Tabs>
  )
}

const composer = () => screen.getByPlaceholderText('Ask about this ticket...')

/**
 * Radix selects a tab on mousedown, not on click, so `fireEvent.click` leaves the panel
 * exactly where it was and a test written with it passes while proving nothing.
 */
const switchTo = (label: string) =>
  fireEvent.mouseDown(screen.getByRole('tab', { name: label }))

describe('the composer draft across a tab switch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.setState({ composerDrafts: new Map() })
  })

  afterEach(cleanup)

  it('still has what was typed after Details and back', () => {
    render(<Panel />)
    fireEvent.change(composer(), { target: { value: 'why does this card need a nav bar?' } })

    switchTo('Details')
    expect(screen.getByText('the details pane')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Ask about this ticket...')).toBeNull()

    switchTo('Agents')
    expect((composer() as HTMLTextAreaElement).value)
      .toBe('why does this card need a nav bar?')
  })

  it('does not carry one card’s draft onto another card', () => {
    const { rerender } = render(<Panel ticketId="POT-1" />)
    fireEvent.change(composer(), { target: { value: 'meant for POT-1' } })

    rerender(<Panel ticketId="POT-2" />)
    expect((composer() as HTMLTextAreaElement).value).toBe('')

    rerender(<Panel ticketId="POT-1" />)
    expect((composer() as HTMLTextAreaElement).value).toBe('meant for POT-1')
  })

  it('is empty again once the message has been sent', async () => {
    render(<Panel />)
    fireEvent.change(composer(), { target: { value: 'ask it now' } })
    fireEvent.click(screen.getByTestId('composer-send'))

    await vi.waitFor(() =>
      expect((composer() as HTMLTextAreaElement).value).toBe(''))

    switchTo('Details')
    switchTo('Agents')
    expect((composer() as HTMLTextAreaElement).value).toBe('')
  })
})
