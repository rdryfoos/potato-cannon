import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { ActivityTab } from './ActivityTab'

// Mock DOM APIs
HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock TanStack Query
const mockRefetchQueries = vi.fn()
let mockUseQueryReturnValue = {
  data: [] as unknown[],
  isLoading: false,
}

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => mockUseQueryReturnValue),
  useQueryClient: () => ({
    refetchQueries: mockRefetchQueries,
    setQueryData: vi.fn(),
  }),
}))

// Mock appStore
const mockIsTicketProcessing = vi.fn().mockReturnValue(false)
const mockIsTicketPending = vi.fn().mockReturnValue(false)

vi.mock('@/stores/appStore', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      isTicketProcessing: mockIsTicketProcessing,
      isTicketPending: mockIsTicketPending,
    }
    return selector(state)
  },
}))

// Mock SSE hooks - store callbacks so we can trigger them
let sessionOutputCallback: ((data: Record<string, unknown>) => void) | null = null
let sessionEndedCallback: ((data: { ticketId?: string }) => void) | null = null

vi.mock('@/hooks/useSSE', () => ({
  useSessionOutput: vi.fn((cb: (data: Record<string, unknown>) => void) => {
    sessionOutputCallback = cb
  }),
  useTicketMessage: vi.fn(),
  useSessionEnded: vi.fn((cb: (data: { ticketId?: string }) => void) => {
    sessionEndedCallback = cb
  }),
}))

// Mock API client
vi.mock('@/api/client', () => ({
  api: {
    getTicketMessages: vi.fn().mockResolvedValue({ messages: [] }),
    respondToQuestion: vi.fn(),
    sendTicketInput: vi.fn().mockResolvedValue({}),
    getTicket: vi.fn().mockResolvedValue({ phase: 'Build' }),
    startTicketChat: vi.fn().mockResolvedValue({ contextId: 'ticketchat_1' }),
    sendTicketChatInput: vi.fn().mockResolvedValue({ ok: true }),
    endTicketChat: vi.fn().mockResolvedValue({ ok: true }),
  },
}))

// Mock markdown renderer
vi.mock('@/lib/markdown', () => ({
  renderMarkdown: vi.fn((text: string) => text),
}))

// Mock child components that aren't relevant
vi.mock('./ArtifactViewerFull', () => ({
  ArtifactViewerFull: () => null,
}))

vi.mock('./TaskList', () => ({
  TaskList: () => null,
}))

vi.mock('./CollapsibleTaskPanel', () => ({
  CollapsibleTaskPanel: () => null,
}))

vi.mock('./RestartPhaseButton', () => ({
  RestartPhaseButton: () => null,
}))

describe('ActivityTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionOutputCallback = null
    sessionEndedCallback = null
  })

  afterEach(() => {
    cleanup()
  })

  it('shows "No messages yet" when there are no messages and no activity', () => {
    render(
      <ActivityTab
        projectId="test-project"
        ticketId="POT-1"
      />
    )

    const emptyStateElement = screen.getByText('No messages yet')
    expect(emptyStateElement).toBeTruthy()
  })

  it('hides "No messages yet" when activity indicator is showing', async () => {
    render(
      <ActivityTab
        projectId="test-project"
        ticketId="POT-1"
      />
    )

    // Simulate a session output event that sets currentActivity
    expect(sessionOutputCallback).not.toBeNull()
    sessionOutputCallback!({
      ticketId: 'POT-1',
      event: {
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'read_file',
              input: { path: 'src/index.ts' },
            },
          ],
        },
      },
    })

    // "No messages yet" should be hidden after state update
    await waitFor(() => {
      const emptyStateElement = screen.queryByText('No messages yet')
      expect(emptyStateElement).toBeNull()
    })
  })
})

describe('ActivityTab - Disabled Input When No Agent Active', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsTicketProcessing.mockReturnValue(false)
    mockIsTicketPending.mockReturnValue(false)
  })

  afterEach(() => {
    cleanup()
  })

  // These two asserted a dead behaviour for a month: the box used to be disabled
  // when no phase agent was running and to say so. The ticket-wide Q&A feature
  // replaced that - with no agent running the box asks the Q&A agent instead - and
  // the tests were never brought along, so the suite carried two permanent
  // failures describing a component that no longer existed.
  it('leaves the textarea usable when no phase agent is active, because the Q&A agent answers', () => {
    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('Ask about this ticket...')
    expect(textarea).toBeTruthy()
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false)
  })

  it('disables send button when no agent is active', () => {
    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const sendButton = screen.getByTestId('composer-send')
    expect(sendButton).toBeTruthy()
    expect((sendButton as HTMLButtonElement).disabled).toBe(true)
  })

  describe('the To: control', () => {
    // The composer had no say in where a message went: it went to the phase worker
    // whenever one was running, and to Buddy only when none was. So a reader watching
    // a card run could not ask a question about it without answering the worker
    // instead, and Buddy was unreachable during the only part of a card's life
    // anybody watches.

    it('offers both recipients', () => {
      render(<ActivityTab projectId="test-project" ticketId="POT-1" />)
      expect(screen.getByTestId('composer-to-worker')).toBeTruthy()
      expect(screen.getByTestId('composer-to-buddy')).toBeTruthy()
    })

    it('shows Buddy as the recipient when no worker is running', () => {
      render(<ActivityTab projectId="test-project" ticketId="POT-1" />)
      expect(screen.getByTestId('composer-to-buddy').getAttribute('aria-pressed')).toBe('true')
      expect(screen.getByTestId('composer-to-worker').getAttribute('aria-pressed')).toBe('false')
    })

    it('cannot address a worker that is not there, and says so rather than failing later', () => {
      render(<ActivityTab projectId="test-project" ticketId="POT-1" />)
      const worker = screen.getByTestId('composer-to-worker') as HTMLButtonElement
      expect(worker.disabled).toBe(true)
      expect(worker.getAttribute('title')).toContain('No worker is running')
    })

    it('shows the worker as the recipient while one runs, which is what it used to do', () => {
      mockIsTicketProcessing.mockReturnValue(true)
      render(<ActivityTab projectId="test-project" ticketId="POT-1" />)
      expect(screen.getByTestId('composer-to-worker').getAttribute('aria-pressed')).toBe('true')
      const worker = screen.getByTestId('composer-to-worker') as HTMLButtonElement
      expect(worker.disabled).toBe(false)
    })

    it('sends to Buddy, not into the worker session, when Buddy is chosen mid-run', async () => {
      // The rule. A question meant for Buddy arriving at a suspended worker as the
      // answer to its question is how BAN-1 went red on 2026-09-23.
      const { api } = await import('@/api/client')
      mockIsTicketProcessing.mockReturnValue(true)
      render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

      fireEvent.click(screen.getByTestId('composer-to-buddy'))
      const textarea = screen.getByPlaceholderText('Type your response...')
      fireEvent.change(textarea, { target: { value: 'what is this card waiting on?' } })
      fireEvent.click(screen.getByTestId('composer-send'))

      await waitFor(() => {
        expect(vi.mocked(api.startTicketChat)).toHaveBeenCalled()
      })
      expect(vi.mocked(api.sendTicketInput)).not.toHaveBeenCalled()
    })

    it('sends to the worker when the worker is chosen', async () => {
      const { api } = await import('@/api/client')
      mockIsTicketProcessing.mockReturnValue(true)
      render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

      fireEvent.click(screen.getByTestId('composer-to-worker'))
      const textarea = screen.getByPlaceholderText('Type your response...')
      fireEvent.change(textarea, { target: { value: 'replace it' } })
      fireEvent.click(screen.getByTestId('composer-send'))

      await waitFor(() => {
        expect(vi.mocked(api.sendTicketInput)).toHaveBeenCalled()
      })
      expect(vi.mocked(api.startTicketChat)).not.toHaveBeenCalled()
    })
  })

  it('enables textarea when agent is processing', () => {
    mockIsTicketProcessing.mockReturnValue(true)

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('Type your response...')
    expect(textarea).toBeTruthy()
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false)
  })

  it('enables textarea when agent is pending', () => {
    mockIsTicketPending.mockReturnValue(true)

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('Type your response...')
    expect(textarea).toBeTruthy()
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false)
  })

  it('enables send button when agent is active and input has text', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    mockIsTicketProcessing.mockReturnValue(true)

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('Type your response...')
    await userEvent.type(textarea, 'Hello')

    const sendButton = screen.getByTestId('composer-send')
    expect((sendButton as HTMLButtonElement).disabled).toBe(false)
  })

  it('says what the box does when no phase agent is active', () => {
    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    expect(screen.getByPlaceholderText('Ask about this ticket...')).toBeTruthy()
    expect(
      screen.getByText(
        'No agent running - this asks a Q&A agent about the ticket, not a phase agent'
      )
    ).toBeTruthy()
  })

  it('shows normal placeholder when agent is active', () => {
    mockIsTicketProcessing.mockReturnValue(true)

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const textarea = screen.getByPlaceholderText('Type your response...')
    expect(textarea).toBeTruthy()
  })
})

describe('ActivityTab - Option Buttons Hidden When No Agent Active', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsTicketProcessing.mockReturnValue(false)
    mockIsTicketPending.mockReturnValue(false)
    mockUseQueryReturnValue = {
      data: [],
      isLoading: false,
    }
  })

  afterEach(() => {
    cleanup()
  })

  it('hides option buttons when no agent is active even if pendingOptions exist', () => {
    // Set up messages with options via the useQuery mock BEFORE rendering
    mockUseQueryReturnValue = {
      data: [
        {
          type: 'question',
          text: 'Pick one',
          options: ['Option A', 'Option B'],
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
    }

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    expect(screen.queryByText('Option A')).toBeNull()
    expect(screen.queryByText('Option B')).toBeNull()
  })

  it('shows option buttons when agent is active and pendingOptions exist', () => {
    // Set up messages with options via the useQuery mock BEFORE rendering
    mockUseQueryReturnValue = {
      data: [
        {
          type: 'question',
          text: 'Pick one',
          options: ['Option A', 'Option B'],
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
    }
    mockIsTicketPending.mockReturnValue(true)

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    expect(screen.getByText('Option A')).toBeTruthy()
    expect(screen.getByText('Option B')).toBeTruthy()
  })
})

describe('ActivityTab - Session Ended Clears Waiting State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsTicketProcessing.mockReturnValue(false)
    mockIsTicketPending.mockReturnValue(false)
    mockUseQueryReturnValue = {
      data: [],
      isLoading: false,
    }
    sessionOutputCallback = null
    sessionEndedCallback = null
  })

  afterEach(() => {
    cleanup()
  })

  it('clears ThinkingIndicator when session ends', async () => {
    mockIsTicketProcessing.mockReturnValue(true)

    const { default: userEvent } = await import('@testing-library/user-event')

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    // Type and send a message to trigger isWaitingForResponse
    const textarea = screen.getByPlaceholderText('Type your response...')
    await userEvent.type(textarea, 'Hello')
    const sendButton = screen.getByTestId('composer-send')
    await userEvent.click(sendButton)

    // Wait for the send to complete and ThinkingIndicator to appear
    await waitFor(() => {
      expect(screen.getByText('Thinking')).toBeTruthy()
    })

    // Simulate session ending via the captured callback
    expect(sessionEndedCallback).not.toBeNull()
    sessionEndedCallback!({ ticketId: 'POT-1' })

    // ThinkingIndicator should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Thinking')).toBeNull()
    })
  })
})

describe('ActivityTab - every message names its speaker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsTicketProcessing.mockReturnValue(false)
    mockIsTicketPending.mockReturnValue(false)
  })

  afterEach(() => {
    cleanup()
    mockUseQueryReturnValue = { data: [], isLoading: false }
  })

  // One feed holding all four kinds, which is the thing that was impossible to
  // read before: two of these four used to be the same purple bubble captioned
  // "Potato", and a third was a grey one captioned "Status Update".
  const feed = [
    {
      type: 'question',
      text: 'Which of these do you want?',
      timestamp: '2026-09-21T01:48:48Z',
      speaker: { kind: 'worker', name: 'Spec worker' },
    },
    {
      type: 'user',
      text: 'A. Defaults accepted.',
      timestamp: '2026-09-21T01:49:24Z',
      speaker: { kind: 'person', name: 'You' },
    },
    {
      type: 'question',
      text: 'The manifest says AC-UI-30 is backlog.',
      timestamp: '2026-09-21T01:52:00Z',
      speaker: { kind: 'buddy', name: 'Buddy' },
    },
    {
      type: 'notification',
      text: 'Ticket blocked automatically: entry check exited 1',
      timestamp: '2026-09-21T01:53:00Z',
      speaker: { kind: 'cannon', name: 'Cannon' },
    },
  ]

  it('names all four speakers in one feed', () => {
    mockUseQueryReturnValue = { data: feed, isLoading: false }

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    expect(screen.getByText('Spec worker')).toBeTruthy()
    expect(screen.getByText('You')).toBeTruthy()
    expect(screen.getByText('Buddy')).toBeTruthy()
    expect(screen.getByText('Cannon')).toBeTruthy()
  })

  it('gives each kind its own colour and the person alone the right-hand side', () => {
    mockUseQueryReturnValue = { data: feed, isLoading: false }

    const { container } = render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    const bubbleFor = (kind: string) =>
      container.querySelector(`[data-speaker="${kind}"]`)!.closest('div.max-w-\\[85\\%\\]')!

    expect(bubbleFor('person').className).toContain('bg-accent/50')
    expect(bubbleFor('worker').className).toContain('bg-bg-secondary')
    expect(bubbleFor('buddy').className).toContain('bg-accent-purple/10')
    expect(bubbleFor('cannon').className).toContain('bg-accent-yellow/10')

    // Four different bubbles, not one class reused.
    const classes = ['person', 'worker', 'buddy', 'cannon'].map((k) => bubbleFor(k).className)
    expect(new Set(classes).size).toBe(4)

    const rowFor = (kind: string) => bubbleFor(kind).parentElement!
    expect(rowFor('person').className).toContain('justify-end')
    for (const kind of ['worker', 'buddy', 'cannon']) {
      expect(rowFor(kind).className).toContain('justify-start')
    }
  })

  it('tells two workers apart rather than calling both of them the agent', () => {
    mockUseQueryReturnValue = {
      data: [
        { type: 'question', text: 'a', timestamp: '1', speaker: { kind: 'worker', name: 'Spec worker' } },
        { type: 'question', text: 'b', timestamp: '2', speaker: { kind: 'worker', name: 'Build worker' } },
        { type: 'notification', text: 'c', timestamp: '3', speaker: { kind: 'worker', name: 'Gate runner' } },
      ],
      isLoading: false,
    }

    render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    expect(screen.getByText('Spec worker')).toBeTruthy()
    expect(screen.getByText('Build worker')).toBeTruthy()
    expect(screen.getByText('Gate runner')).toBeTruthy()
    expect(screen.queryByText('Potato')).toBeNull()
    expect(screen.queryByText('Status Update')).toBeNull()
  })

  it('shows a caller that is not the panel as that caller, not as the person', () => {
    mockUseQueryReturnValue = {
      data: [
        {
          type: 'user',
          text: 'posted by a script',
          timestamp: '1',
          speaker: { kind: 'cannon', name: 'An unnamed caller' },
        },
      ],
      isLoading: false,
    }

    const { container } = render(<ActivityTab projectId="test-project" ticketId="POT-1" />)

    expect(screen.getByText('An unnamed caller')).toBeTruthy()
    // Not in the person's bubble and not on the person's side, even though the
    // message's type is still "user".
    const bubble = container.querySelector('[data-speaker="cannon"]')!.closest('div.max-w-\\[85\\%\\]')!
    expect(bubble.className).not.toContain('bg-accent/50')
    expect(bubble.parentElement!.className).toContain('justify-start')
  })
})
