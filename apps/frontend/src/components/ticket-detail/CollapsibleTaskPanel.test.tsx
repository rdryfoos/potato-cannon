import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CollapsibleTaskPanel } from './CollapsibleTaskPanel'

// Mock the API client
vi.mock('@/api/client', () => ({
  api: {
    getTicketTasks: vi.fn(),
  },
}))

import { api } from '@/api/client'
const mockGetTicketTasks = vi.mocked(api.getTicketTasks)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const baseTasks = [
  {
    id: 'task-1',
    ticketId: 'POT-1',
    displayNumber: 1,
    phase: 'Build',
    status: 'completed' as const,
    attemptCount: 1,
    description: 'Set up project structure',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'task-2',
    ticketId: 'POT-1',
    displayNumber: 2,
    phase: 'Build',
    status: 'in_progress' as const,
    attemptCount: 1,
    description: 'Implement the collapsible panel component with animations',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'task-3',
    ticketId: 'POT-1',
    displayNumber: 3,
    phase: 'Build',
    status: 'pending' as const,
    attemptCount: 0,
    description: 'Write tests',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

describe('CollapsibleTaskPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when tasks array is empty', async () => {
    mockGetTicketTasks.mockResolvedValue([])
    const { container } = render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      expect(mockGetTicketTasks).toHaveBeenCalled()
    })
    expect(container.innerHTML).toBe('')
  })

  it('shows every task, with no control that could hide them', async () => {
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      expect(screen.getAllByText('Set up project structure').length).toBeGreaterThan(0)
    })
    expect(screen.queryByText('Implement the collapsible panel component with animations')).not.toBeNull()
    expect(screen.queryByText('Write tests')).not.toBeNull()
  })

  it('shows the task count in the header', async () => {
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      expect(screen.queryByText('1/3')).not.toBeNull()
    })
  })

  it('renders task list with correct tasks', async () => {
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      expect(screen.getAllByTestId('task-item-task-1').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByTestId('task-item-task-2').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('task-item-task-3').length).toBeGreaterThan(0)
  })

  it('has a header that is a label, not a control', async () => {
    // The header used to be a button that folded the tasks away. A panel that can be
    // collapsed is a panel that can be found collapsed, by a reader who did not collapse
    // it and has no reason to think anything is behind it. The header stays, because a
    // reader wants to know what they are looking at and how much of it is done; the
    // control goes.
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      expect(screen.getAllByTestId('task-panel-header').length).toBeGreaterThan(0)
    })

    const header = screen.getAllByTestId('task-panel-header')[0]
    expect(header.tagName).not.toBe('BUTTON')
    expect(header.querySelector('button')).toBeNull()
    expect(header.closest('button')).toBeNull()
  })

  it('keeps the tasks visible with no height a collapse could set to zero', async () => {
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      expect(screen.getAllByTestId('task-panel-content').length).toBeGreaterThan(0)
    })

    const content = screen.getAllByTestId('task-panel-content')[0] as HTMLElement
    expect(content.style.maxHeight).toBe('')
    expect(screen.getAllByTestId('task-item-task-1').length).toBeGreaterThan(0)
  })

  it('no longer shows the one-line summary that stood in for the hidden list', async () => {
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      expect(screen.getAllByTestId('task-panel-header').length).toBeGreaterThan(0)
    })
    expect(screen.queryByTestId('collapsed-summary')).toBeNull()
  })

  it('renders content area with correct structure', async () => {
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      expect(screen.getAllByTestId('task-panel-content').length).toBeGreaterThan(0)
    })
  })

  it('opens task detail dialog when a task is clicked', async () => {
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      expect(screen.getAllByText('Set up project structure').length).toBeGreaterThan(0)
    })

    // Click the first task item
    const taskItem = screen.getAllByTestId('task-item-task-1')[0]
    await userEvent.click(taskItem)

    await waitFor(() => {
      const titleEls = screen.getAllByText(/Task #\d+/)
      expect(titleEls.length).toBeGreaterThan(0)
    })
  })

  it('dialog shows task details when opened', async () => {
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      expect(screen.getAllByText('Set up project structure').length).toBeGreaterThan(0)
    })

    // Open dialog by clicking task
    const taskItem = screen.getAllByTestId('task-item-task-1')[0]
    taskItem.click()

    await waitFor(() => {
      const titleEls = screen.getAllByText(/Task #\d+/)
      expect(titleEls.length).toBeGreaterThan(0)
    })

    // Verify task details are shown in dialog with correct status badge
    const statusBadges = screen.getAllByText('completed')
    expect(statusBadges.length).toBeGreaterThan(0)
  })

  it('displays task description in the list', async () => {
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      const elements = screen.getAllByText('Implement the collapsible panel component with animations')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  it('shows completed tasks with strikethrough', async () => {
    mockGetTicketTasks.mockResolvedValue(baseTasks)
    render(
      <CollapsibleTaskPanel projectId="proj-1" ticketId="POT-1" currentPhase="Build" />,
      { wrapper: createWrapper() },
    )
    await waitFor(() => {
      const taskItem = screen.getAllByTestId('task-item-task-1')[0]
      const span = taskItem.querySelector('span')
      expect(span?.className).toContain('line-through')
    })
  })
})
