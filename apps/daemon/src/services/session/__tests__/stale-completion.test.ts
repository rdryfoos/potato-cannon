import { describe, it } from "node:test";
import assert from "node:assert";

import { isStaleCompletion, handleAgentCompletion, type ExecutorCallbacks } from "../worker-executor.js";
import type { TicketPhase } from "../../../types/ticket.types.js";

/**
 * A finished agent must not advance a ticket that a hand has already moved.
 *
 * Reproduced on the pinned fork before this fix: a ticket moved by hand from
 * Build to Review while its Build agent was running was moved on to Gate when
 * that agent exited, by the orchestrator, out of a phase a person had put it in.
 */
describe("stale completions", () => {
  const exploding: ExecutorCallbacks = new Proxy({} as ExecutorCallbacks, {
    get(_t, prop) {
      return () => {
        throw new Error(`callback ${String(prop)} must not run for a stale completion`);
      };
    },
  });

  describe("isStaleCompletion", () => {
    it("is stale when the ticket has moved on", () => {
      assert.strictEqual(isStaleCompletion("Build" as TicketPhase, "Review" as TicketPhase), true);
      assert.strictEqual(isStaleCompletion("Build" as TicketPhase, "Ideas" as TicketPhase), true);
    });

    it("is not stale when the ticket is still where the agent ran", () => {
      assert.strictEqual(isStaleCompletion("Build" as TicketPhase, "Build" as TicketPhase), false);
    });

    it("is not stale when the current phase cannot be read", () => {
      // An unreadable ticket is not evidence that a hand moved it, and refusing
      // to advance on no evidence would strand every card the store cannot answer for.
      assert.strictEqual(isStaleCompletion("Build" as TicketPhase, null), false);
      assert.strictEqual(isStaleCompletion("Build" as TicketPhase, undefined), false);
    });
  });

  describe("handleAgentCompletion", () => {
    it("returns without touching phase config, worker state or callbacks when the ticket has moved", async () => {
      // No database is initialised in this test process. Reaching phase config
      // or worker state would throw, which is exactly what the unfixed code did:
      // it read them before ever asking where the ticket is now.
      await handleAgentCompletion(
        "proj",
        "STA-1",
        "Build" as TicketPhase,
        "/tmp/project",
        0,
        "builder",
        { approved: true },
        exploding,
        { getCurrentPhase: async () => "Review" as TicketPhase }
      );
    });

    it("carries on into the normal path when the ticket has not moved", async () => {
      // The guard must not swallow live completions: with the ticket still in
      // Build, the call proceeds and fails on the uninitialised database rather
      // than returning quietly.
      await assert.rejects(
        handleAgentCompletion(
          "proj",
          "STA-1",
          "Build" as TicketPhase,
          "/tmp/project",
          0,
          "builder",
          { approved: true },
          exploding,
          { getCurrentPhase: async () => "Build" as TicketPhase }
        )
      );
    });
  });
});
