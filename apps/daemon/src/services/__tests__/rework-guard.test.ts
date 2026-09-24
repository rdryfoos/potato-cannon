import { describe, it } from "node:test";
import assert from "node:assert";
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

  it("refuses an agent while a worker is on the card", () => {
    const refusal = refusesReworkWrite({ blocks: rework, workerActive: true, fromAgent: true });
    assert.ok(refusal, "expected a refusal");
    assert.match(String(refusal), /attempt is running/);
    assert.match(String(refusal), /when the worker lands/);
  });

  it("lets the agent write it once the worker has landed", () => {
    assert.strictEqual(
      refusesReworkWrite({ blocks: rework, workerActive: false, fromAgent: true }),
      null,
    );
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
