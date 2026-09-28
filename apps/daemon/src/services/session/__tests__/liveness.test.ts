import { describe, it } from "node:test";
import assert from "node:assert";
import { isPidAlive, sessionIsAlive, sweepDeadSessions } from "../liveness.js";

/**
 * Whether an attempt is running, asked rather than remembered.
 *
 * On 2026-09-27 a card in Review, whose Build worker had exited and whose Gate had
 * gone GREEN two days earlier, refused a write because "an attempt is running on this
 * card now". Nothing was running. `ended_at IS NULL` is a flag somebody has to clear,
 * and every way of not clearing it leaves a card busy for ever.
 *
 * The clock and the signal are passed in, because the cases worth testing are a dead
 * pid and a row from a previous boot, and neither can be arranged by running a test on
 * a machine that is behaving.
 */

const BOOT = Date.parse("2026-09-27T12:00:00.000Z");
const after = new Date(BOOT + 60_000).toISOString();
const before = new Date(BOOT - 60_000).toISOString();

const alive = () => undefined as never;
const dead = () => {
  const e = new Error("no such process") as NodeJS.ErrnoException;
  e.code = "ESRCH";
  throw e;
};
const theirs = () => {
  const e = new Error("operation not permitted") as NodeJS.ErrnoException;
  e.code = "EPERM";
  throw e;
};

describe("is that pid alive", () => {
  it("yes when the signal lands", () => {
    assert.strictEqual(isPidAlive(4242, alive), true);
  });

  it("no when there is no such process", () => {
    assert.strictEqual(isPidAlive(4242, dead), false);
  });

  it("yes on EPERM, because a process somebody else owns is still a process", () => {
    // Treating it as dead is the optimistic answer, and the optimistic answer is how a
    // card gets written to while a worker is mid-attempt.
    assert.strictEqual(isPidAlive(4242, theirs), true);
  });

  it("no for nothing, zero, a negative or a fraction", () => {
    for (const pid of [null, undefined, 0, -1, 1.5]) {
      assert.strictEqual(isPidAlive(pid as number, alive), false, String(pid));
    }
  });
});

describe("is that session still running", () => {
  it("a row with a dead pid reads as not running", () => {
    // The case from the card: the worker exited, nothing observed it, the row stayed.
    assert.strictEqual(
      sessionIsAlive({ id: "s1", pid: 4242, startedAt: after }, BOOT, dead), false);
  });

  it("a row with no pid reads as not running, which is every row before the migration", () => {
    assert.strictEqual(
      sessionIsAlive({ id: "s1", pid: null, startedAt: after }, BOOT, alive), false);
    assert.strictEqual(
      sessionIsAlive({ id: "s1", startedAt: after }, BOOT, alive), false);
  });

  it("a row started before this daemon booted reads as not running, whatever the pid says", () => {
    // A daemon's children die with it. This is also what settles pid reuse, which is
    // the one way a liveness check can be wrong in the direction that keeps a card
    // stuck: a recycled pid answering for a worker that ended two days ago.
    assert.strictEqual(
      sessionIsAlive({ id: "s1", pid: 4242, startedAt: before }, BOOT, alive), false);
  });

  it("a row from this boot with a live pid reads as running", () => {
    assert.strictEqual(
      sessionIsAlive({ id: "s1", pid: 4242, startedAt: after }, BOOT, alive), true);
  });

  it("an unreadable started_at falls back to the pid rather than guessing", () => {
    assert.strictEqual(
      sessionIsAlive({ id: "s1", pid: 4242, startedAt: "not a date" }, BOOT, alive), true);
    assert.strictEqual(
      sessionIsAlive({ id: "s1", pid: 4242, startedAt: null }, BOOT, dead), false);
  });
});

describe("the boot sweep", () => {
  // It reads the database first and the log second, and that order is the fix. The
  // sweep used to *be* the log pass: it ended a row only when it found a file that
  // parsed, opened on session_start and did not close on session_end. The shape a
  // killed process leaves is a file whose last line is half-written, which throws in
  // JSON.parse, and the row stayed open. The card then said an attempt was running.
  const rows = [
    { id: "dead", pid: 1111, startedAt: after },
    { id: "live", pid: 2222, startedAt: after },
    { id: "no-pid", pid: null, startedAt: after },
    { id: "last-boot", pid: 3333, startedAt: before },
  ];

  function sweep(alive: (r: { id: string }) => boolean) {
    const ended: string[] = [];
    const closed = sweepDeadSessions({
      open: () => rows,
      end: (id) => ended.push(id),
      alive,
    });
    return { ended, closed };
  }

  it("closes every row whose process is gone and leaves the live one", () => {
    const { ended, closed } = sweep((r) => r.id === "live");
    assert.deepStrictEqual(ended.sort(), ["dead", "last-boot", "no-pid"]);
    assert.deepStrictEqual(closed.sort(), ["dead", "last-boot", "no-pid"]);
  });

  it("closes a row whose log was truncated, because it never reads the log", () => {
    // The row is the record. A half-written log is a thing a reader opens, and it
    // cannot keep a card busy any more because nothing consults it to decide.
    const { ended } = sweep(() => false);
    assert.ok(ended.includes("dead"));
    assert.strictEqual(ended.length, rows.length);
  });

  it("closes nothing when everything is alive", () => {
    assert.deepStrictEqual(sweep(() => true).closed, []);
  });

  it("uses the real liveness rule when none is passed", () => {
    // Which, for these rows, means: no pid and last boot are gone whatever the pids do.
    const ended: string[] = [];
    sweepDeadSessions({ open: () => rows, end: (id) => ended.push(id) });
    assert.ok(ended.includes("no-pid"));
    assert.ok(ended.includes("last-boot"));
  });
});
