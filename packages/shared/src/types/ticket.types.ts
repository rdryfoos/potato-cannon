export interface Ticket {
  id: string
  title: string
  description?: string
  phase: string
  project?: string
  createdAt: string
  updatedAt: string
  images?: string[]
  history: TicketHistoryEntry[]
  archived?: boolean
  archivedAt?: string
  conversationId?: string
  pendingPhase?: string
  epicId?: string
  blocked?: boolean
  blockedAt?: string
}

export interface ArchiveResult {
  ticket: Ticket
  cleanup: {
    worktreeRemoved: boolean
    branchRemoved: boolean
    errors: string[]
  }
}

export interface HistorySessionRecord {
  sessionId: string
  source: string
  startedAt: string
  endedAt?: string
  exitCode?: number
}

export interface TicketHistoryEntry {
  phase: string
  at: string
  sessionId?: string
  sessions?: HistorySessionRecord[]
  endedAt?: string
  reason?: string
  /** Who caused this transition: "hand:<user>", "auto", or "hook:<name>". Absent on
   * rows written before the actor was recorded. */
  actor?: string
  /** A move that was refused. The card did not enter this phase; somebody tried. */
  refused?: true
}
