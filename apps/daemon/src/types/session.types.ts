export interface SessionMeta {
  projectId: string;
  ticketId?: string;
  ticketTitle?: string;
  brainstormId?: string;
  brainstormName?: string;
  epicId?: string;
  epicTitle?: string;
  phase?: string;
  worktreePath?: string;
  branchName?: string;
  startedAt: string;
  status?: "running" | "completed" | "failed";
  exitCode?: number;
  endedAt?: string;
  /** The agent type being run (e.g., 'potato:refinement') */
  agentType?: string;
  /** Current stage index within the phase */
  stage?: number;
}

export interface Session {
  id: string;
  meta: SessionMeta;
  status: "running" | "completed" | "error";
}

export interface SessionInfo {
  id: string;
  projectId: string;
  ticketId?: string;
  ticketTitle?: string;
  brainstormId?: string;
  brainstormName?: string;
  phase?: string;
  worktreePath?: string;
  branchName?: string;
  startedAt: string;
  status: "running" | "completed" | "failed";
  exitCode?: number;
  endedAt?: string;
}

export interface SessionLogEntry {
  type: "session_start" | "output" | "session_end" | "raw";
  timestamp: string;
  meta?: SessionMeta;
  data?: string;
  content?: string;
}

export interface SessionOptions {
  phase?: string;
  resumeId?: string;
}

// =============================================================================
// Session Store Types (SQLite-backed)
// =============================================================================

export interface CreateSessionInput {
  /** The operating system's id for the process this session runs in, so that whether
   *  it is still running can be asked rather than remembered. */
  pid?: number | null;
  projectId: string;
  ticketId?: string;
  brainstormId?: string;
  claudeSessionId?: string;
  agentSource?: string;
  phase?: string;
  metadata?: Record<string, unknown>;
}

export interface StoredSession {
  id: string;
  /** The process this session runs in, when one has been recorded. */
  pid?: number;
  projectId: string;
  ticketId?: string;
  brainstormId?: string;
  conversationId?: string;
  claudeSessionId?: string;
  agentSource?: string;
  startedAt: string;
  endedAt?: string;
  exitCode?: number;
  phase?: string;
  metadata?: Record<string, unknown>;
}
