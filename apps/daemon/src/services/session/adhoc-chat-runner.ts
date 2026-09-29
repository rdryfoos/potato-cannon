// Shared PTY-spawn-and-wire-handlers logic for ad-hoc, on-demand Q&A
// sessions - both artifact-chat (one artifact) and ticket-chat (a whole
// ticket). Extracted from artifact-chat.routes.ts so the fixes below live
// in one place instead of being copy-pasted per feature (which is how the
// PTY-chunking bug happened in the first place - the buggy pattern was
// copied from session.service.ts without anyone noticing it was broken).
import { execSync } from "child_process";
import { whichSync } from "../../lib/windows-exec.js";
import { createWriteStream } from "fs";
import path from "path";
import pty from "node-pty";
import type { ArtifactChatSession } from "../../stores/artifact-chat.store.js";
import { artifactChatStore } from "../../stores/artifact-chat.store.js";
import {
  createStoredSession,
  endStoredSession,
  setStoredSessionPid,
  updateClaudeSessionId,
} from "../../stores/session.store.js";
import { SESSIONS_DIR } from "../../config/paths.js";

export function runAdhocChatProcess(
  session: ArtifactChatSession,
  args: string[],
  projectPath: string,
  projectId: string,
  ticketId: string,
  agentSource: string,
  meta: Record<string, unknown>
): void {
  const logPath = path.join(SESSIONS_DIR, `${session.sessionId}.jsonl`);
  const logStream = createWriteStream(logPath, { flags: "a" });

  // Register in the shared `sessions` table, same as every other spawned
  // Claude process (see session.service.ts). Without this,
  // ChatService.askAsync's getActiveSessionForTicket(ticketId) lookup - how
  // it finds the claude_session_id to embed in a pending question for later
  // --resume - finds nothing for these ad-hoc processes, since they used to
  // exist only in the separate in-memory artifactChatStore. That silently
  // broke every follow-up: the question got asked and answered once, but
  // nothing was ever resumable after that.
  const storedSession = createStoredSession({
    projectId,
    ticketId,
    agentSource,
  });

  let claudeSessionIdCaptured = false;

  let claudePath: string;
  try {
    claudePath = whichSync("claude");
  } catch {
    claudePath = path.join(process.env.HOME || "", ".local", "bin", "claude");
  }

  const proc = pty.spawn(claudePath, args, {
    name: "xterm-256color",
    cols: 120,
    rows: 40,
    cwd: projectPath,
    env: {
      ...process.env,
      POTATO_PROJECT_ID: projectId,
      POTATO_TICKET_ID: ticketId,
      POTATO_BRAINSTORM_ID: session.contextId,
    },
  });

  // The pid, for the same reason every other spawn records one: whether this session is
  // still running is asked of the operating system rather than read from a flag. Without
  // it the row reads as not alive the moment it is written, and that is what stopped a
  // second turn on a card. ChatService.askAsync looks this session up to find the
  // claude_session_id it embeds for a later --resume; that lookup ends rows whose
  // process is gone; an adhoc session with no pid was gone before it started.
  setStoredSessionPid(storedSession.id, proc.pid ?? null);

  // node-pty delivers data in ~1KB read chunks, not one chunk per logical
  // line - a single stream-json event (the system/init event especially,
  // with its full tool list, routinely exceeds that) can span several
  // onData calls. Splitting per-call with no carryover buffer means a split
  // event never reassembles and silently becomes unparseable - exactly how
  // claude_session_id capture below was failing 100% of the time despite
  // the data being genuinely present in the stream. Buffer across calls;
  // only process text up to the last newline in each call, carry the
  // remainder forward.
  let lineBuffer = "";

  proc.onData((data: string) => {
    lineBuffer += data;
    const lastNewline = lineBuffer.lastIndexOf("\n");
    if (lastNewline === -1) return;
    const complete = lineBuffer.slice(0, lastNewline);
    lineBuffer = lineBuffer.slice(lastNewline + 1);

    const lines = complete.split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        const logEntry = { ...event, timestamp: new Date().toISOString() };
        logStream.write(JSON.stringify(logEntry) + "\n");

        if (!claudeSessionIdCaptured && event.type === "system" && event.session_id) {
          claudeSessionIdCaptured = true;
          updateClaudeSessionId(storedSession.id, event.session_id);
        }
      } catch {
        logStream.write(
          JSON.stringify({
            type: "raw",
            content: line,
            timestamp: new Date().toISOString(),
          }) + "\n"
        );
      }
    }
  });

  proc.onExit(({ exitCode }) => {
    console.log(
      `[adhoc-chat:${agentSource}] Session ${session.contextId} exited with code: ${exitCode}`
    );

    const endReason =
      exitCode === 0 ? "completed" : exitCode === -1 ? "timeout" : "error";
    // Marks the panel's own session inactive again. This is correct even
    // after a resume: the agent answered (or didn't) and the process
    // exited the same way a fresh session does. A further follow-up goes
    // through the route's own resume path again, same as this one did.
    artifactChatStore.endSession(session.contextId, endReason);
    endStoredSession(storedSession.id, exitCode);

    logStream.write(
      JSON.stringify({
        type: "session_end",
        meta: {
          ...meta,
          status: exitCode === 0 ? "completed" : "failed",
          exitCode,
          endedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      }) + "\n"
    );
    logStream.end();
  });
}

/**
 * What an ad-hoc agent may do, and where.
 *
 * `pen` is the card's own worktree, and it is passed only for a card in Review. A
 * reader looking at a finished card will sometimes want something different, and what
 * they say is the change itself; the agent already on the card is the one that has
 * read it. `cannon-template/agents/ticket-qa.md` carries the rules it writes under:
 * the card's branch, files the card's IDs govern, commit, tests, the Gate after every
 * write, and the card staying in Review.
 *
 * The powers are given in one place so that "which agent may write" is answerable by
 * reading one function rather than by reasoning about a prompt. A prompt is an
 * instruction; this is the fence.
 */
export function buildAdhocChatArgs(
  mcpConfig: unknown,
  promptOrMessage: string,
  resumeClaudeSessionId?: string,
  pen?: { worktree: string } | null,
): string[] {
  const args = [
    "--dangerously-skip-permissions",
    "--output-format",
    "stream-json",
    "--verbose",
    "--mcp-config",
    JSON.stringify(mcpConfig),
    // An ad-hoc agent answers questions about work somebody else did. It has no call
    // to change anything, and no call to leave the machine, so it is given the tools
    // that read and refused the ones that do not. Bash is on the refused list because
    // a shell is every other tool at once: with it, "cannot write" and "cannot reach
    // the network" are sentences rather than facts.
    //
    // What this does not do, stated because an estate declaring its surface has to
    // know: it does not confine reads to a directory. Read, Grep and Glob take
    // absolute paths and Claude Code has no jail, so an ad-hoc agent can read whatever
    // the account running the daemon can read. The prompt can ask it not to; only the
    // account's own permissions can stop it.
    "--allowedTools",
    pen ? "Read,Grep,Glob,Edit,Write,Bash" : "Read,Grep,Glob",
    "--disallowedTools",
    pen
      // With the pen, the shell is the point: the commit, the tests and the Gate are
      // all run through it. What stays refused is the network, which no change to a
      // card's own files ever needs, and which is the one power whose absence cannot
      // be checked afterwards by reading the branch.
      ? "Skill(superpowers:*),NotebookEdit,WebFetch,WebSearch"
      : "Skill(superpowers:*),Edit,Write,NotebookEdit,Bash,WebFetch,WebSearch",
  ];
  if (pen) {
    // The worktree is the working directory, so a relative path lands on the card's
    // branch and an absolute one out of it is the reader's to notice rather than the
    // ordinary case. Claude Code has no jail: this is where writes go, not a wall
    // around where they can go, and the prompt is what says which files are the
    // card's. Said plainly because an estate declaring its surface has to.
    args.push("--add-dir", pen.worktree);
  }
  if (resumeClaudeSessionId) {
    args.push("--resume", resumeClaudeSessionId);
  }
  args.push("--print", promptOrMessage);
  return args;
}
