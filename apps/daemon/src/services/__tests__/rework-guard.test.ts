import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { refusesReworkWrite } from "../rework-guard.js";

/**
 * Who may write a Rework block, and when.
 *
 * A Rework block is an instruction the Build worker reads at the start of an attempt.
 * Written while an attempt is already running, it is an instruction the worker has read
 * past, or will read halfway through, and the card then says a change was asked for
 * that the running attempt never saw.
 *
 * Buddy is the caller this is for: with the composer's To: control it is answerable
 * while a worker runs, and answering is all it may do until the worker lands.
 */
describe("a Rework block written mid-attempt", () => {
  const rework = [{ name: "rework" }];

  it("refuses an agent, whether or not a worker is on the card", () => {
    // It used to turn on whether a worker was running, which was the narrower rule
    // while Buddy could write the block but should not have written it mid-attempt.
    // As of 2026-09-28 the block is a hand's: a change within the card's promises
    // Buddy makes on the branch, and one outside them it refuses by naming the ID
    // that would have to be created. Neither is a Rework block, so a quiet card is
    // not a reason to hand an agent the pen for the wrong thing.
    for (const workerActive of [true, false]) {
      const refusal = refusesReworkWrite({ blocks: rework, workerActive, fromAgent: true });
      assert.ok(refusal, `expected a refusal with workerActive=${workerActive}`);
      assert.match(String(refusal), /a hand's/);
      assert.match(String(refusal), /make it on the branch/);
      assert.match(String(refusal), /name the ID it would need/);
    }
  });

  it("does not decide on workerActive at all, so the field may be absent", () => {
    const refusal = refusesReworkWrite({ blocks: rework, fromAgent: true });
    assert.ok(refusal, "expected a refusal with no workerActive given");
  });

  it("does not stop a hand, which has chosen to", () => {
    // Rik writes Rework blocks by hand. An agent has merely been asked a question.
    assert.strictEqual(
      refusesReworkWrite({ blocks: rework, workerActive: true, fromAgent: false }),
      null,
    );
  });

  it("stops the Rework block only, not everything the agent writes", () => {
    // Buddy still writes an ids: line and a proposed block in Ideas, and a worker
    // still writes branch:, head: and try: while it runs.
    assert.strictEqual(
      refusesReworkWrite({
        blocks: [{ name: "proposed" }, { name: "thread-report" }],
        workerActive: true,
        fromAgent: true,
      }),
      null,
    );
    assert.strictEqual(
      refusesReworkWrite({ blocks: [], workerActive: true, fromAgent: true }),
      null,
    );
    assert.strictEqual(
      refusesReworkWrite({ workerActive: true, fromAgent: true }),
      null,
    );
  });

  it("is not fooled by the case or the spacing of the block name", () => {
    for (const name of ["Rework", "  rework  ", "REWORK"]) {
      assert.ok(
        refusesReworkWrite({ blocks: [{ name }], workerActive: true, fromAgent: true }),
        `expected ${JSON.stringify(name)} to be refused`,
      );
    }
  });

  it("catches it among other blocks in the same write", () => {
    assert.ok(
      refusesReworkWrite({
        blocks: [{ name: "proposed" }, { name: "rework" }],
        workerActive: true,
        fromAgent: true,
      }),
    );
  });
});

describe("a pending question does not hold the card on its own", () => {
  // The refusal a card in Review gave on 2026-09-27 read "an attempt is running on
  // this card now", and it was true of neither half of what it was reading. The
  // session flag was stale, and `pending_questions` is reconciled by nothing at all:
  // a question whose asker died held the card for ever and no sweep would have found
  // it, because no sweep looks there.
  //
  // The half is gone rather than made live, because liveness subsumes it: a question
  // is a reason to wait only while somebody is waiting for the answer, and somebody
  // waiting is a live session, which is already the whole of the test.
  // From the source tree, not from dist beside this compiled test: the expression is
  // what a reader of the route sees, and reading the build back would be reading the
  // same decision through a transpiler.
  const route = readFileSync(
    join(process.cwd(), "src/server/routes/tickets.routes.ts"),
    "utf8",
  );
  const where = route.slice(route.indexOf("const refusal = refusesReworkWrite("));
  const call = where.slice(0, where.indexOf("});"));

  it("workerActive is the liveness question and nothing else", () => {
    assert.match(call, /workerActive: Boolean\(getActiveSessionForTicket\(ticketId\)\)/);
  });

  it("readQuestion is no longer part of it", () => {
    assert.ok(
      !call.includes("readQuestion"),
      "a pending question is back in workerActive, and nothing reconciles that table",
    );
  });
});
