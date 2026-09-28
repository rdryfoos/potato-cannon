/**
 * Whether an attempt is running on a card, asked of the operating system.
 *
 * It used to be a flag. `sessions.ended_at IS NULL` meant running, set when a process
 * was spawned and cleared when its exit was observed, and every way of not observing an
 * exit left it set for ever. On 2026-09-27 a card in Review, whose Build worker had
 * exited and whose Gate had gone GREEN two days earlier, refused a write because "an
 * attempt is running on this card now". Nothing was running. Nothing on the card said
 * otherwise, because the card was reading the same flag.
 *
 * Two questions are asked here, and a row has to pass both:
 *
 *   1. Was it started by the daemon that is running now? A daemon's children die with
 *      it, so a row from before this boot is a row whose process is gone whatever its
 *      pid now says. This also settles pid reuse, which is the one way a liveness check
 *      can be wrong in the direction that keeps a card stuck.
 *   2. Is the pid alive? `process.kill(pid, 0)` signals nothing and answers that.
 *
 * A row that fails either is ended on the spot, so the answer is also the repair. That
 * is deliberate: a reader who opens the card after this has a card that says what is
 * true, rather than one that will say it next time somebody happens to look.
 */

/** When this daemon booted. Anything started before it belongs to a dead daemon. */
const BOOTED_AT = Date.now();

/**
 * True when a process with this id exists.
 *
 * `EPERM` is alive: the process is there and belongs to somebody else, which is not a
 * state this daemon creates but is one a recycled pid can present. Treating it as dead
 * would be the optimistic answer, and the optimistic answer is how a card gets written
 * to while a worker is mid-attempt.
 */
export function isPidAlive(pid: number | null | undefined, kill = process.kill): boolean {
  if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 0) return false;
  try {
    kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException)?.code === "EPERM";
  }
}

export interface LivenessRow {
  id: string;
  pid?: number | null;
  startedAt?: string | null;
}

/**
 * Whether one open session row is really still running.
 *
 * Pure, with the clock and the signal passed in, because the interesting cases are a
 * dead pid and a row from a previous boot and neither can be arranged by running a
 * test on a machine that is behaving.
 */
export function sessionIsAlive(
  row: LivenessRow,
  bootedAt: number = BOOTED_AT,
  kill: typeof process.kill = process.kill,
): boolean {
  if (row.pid === null || row.pid === undefined) return false;
  const started = row.startedAt ? Date.parse(row.startedAt) : NaN;
  if (!Number.isNaN(started) && started < bootedAt) return false;
  return isPidAlive(row.pid, kill);
}

export function daemonBootedAt(): number {
  return BOOTED_AT;
}

export interface SweepDeps {
  open: () => LivenessRow[];
  end: (sessionId: string, exitCode: number) => unknown;
  alive?: (row: LivenessRow) => boolean;
}

/**
 * Close every open session whose process is gone. Returns the ids it closed.
 *
 * This runs at boot, before anything reads a log, and that order is the fix. The sweep
 * used to be the log pass: it walked the session directory and ended a row only when it
 * found a file that parsed, opened on `session_start` and did not close on
 * `session_end`. Every other shape left the row open, and the shape a killed process
 * leaves is a file whose last line is half-written.
 *
 * The rows are the record. A log is a thing a reader opens.
 */
export function sweepDeadSessions(deps: SweepDeps): string[] {
  const alive = deps.alive ?? sessionIsAlive;
  const closed: string[] = [];
  for (const row of deps.open()) {
    if (alive(row)) continue;
    deps.end(row.id, -1);
    closed.push(row.id);
  }
  return closed;
}
