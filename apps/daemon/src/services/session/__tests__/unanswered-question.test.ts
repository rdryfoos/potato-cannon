import { describe, it } from "node:test";
import assert from "node:assert";

import { handleAgentCompletion, type ExecutorCallbacks } from "../worker-executor.js";
import type { TicketPhase } from "../../../types/ticket.types.js";

/**
 * A turn that ends on an unanswered question does not move the card.
 *
 * The suspension check read `exitCode === 0 && ticketId`. A worker that asked a
 * question and then died, or was killed, or exited non-zero for any other reason, fell
 * straight through to the completion path with its question still unanswered: the
 * worker tree advanced, the card promoted, and the question went with it into a phase
 * nobody was going to answer it from.
 *
 * Whether a turn ended well and whether anybody answered it are two questions, and
 * only the second decides where the card goes.
 */
describe("an unanswered question holds the card", () => {
  const exploding: ExecutorCallbacks = new Proxy({} as ExecutorCallbacks, {
    get(_t, prop) {
      return () => {
        throw new Error(`callback ${String(prop)} must not run while a question is unanswered`);
      };
    },
  });

  const pending = {
    conversationId: "conv-1",
    question: "build on it, replace it, or leave two paths?",
    options: ["build on it", "replace it", "leave two paths"],
    askedAt: new Date().toISOString(),
  };

  const phaseConfig = { id: "Build", name: "Build", workers: [] } as never;

  const run = (exitCode: number, approved: boolean) =>
    handleAgentCompletion(
      "proj",
      "UNQ-1",
      "Build" as TicketPhase,
      "/tmp/project",
      exitCode,
      "builder",
      { approved },
      exploding,
      {
        getCurrentPhase: async () => "Build" as TicketPhase,
        getPhaseConfig: async () => phaseConfig,
        readQuestion: () => pending as never,
        isPhaseAutomated: async () => false,
      },
    );

  it("holds on a clean exit, as it always did", async () => {
    await run(0, true);
  });

  it("holds on a non-zero exit, which it did not", async () => {
    // The defect. A worker that asked and then fell over took its card forward with
    // the question still on it.
    await run(1, false);
  });

  it("holds when the worker was killed", async () => {
    await run(137, false);
  });

  it("holds even when the verdict says approved", async () => {
    // An approving verdict on a turn that ended mid-question is a verdict about
    // nothing: the work the question was about has not been decided yet.
    await run(2, true);
  });

  it("carries on into the normal path once the question is answered", async () => {
    // The guard must not swallow live completions. With no pending question the call
    // proceeds and fails on the uninitialised database rather than returning quietly,
    // which is how the neighbouring stale-completion test proves the same thing.
    await assert.rejects(
      handleAgentCompletion(
        "proj",
        "UNQ-1",
        "Build" as TicketPhase,
        "/tmp/project",
        0,
        "builder",
        { approved: true },
        exploding,
        {
          getCurrentPhase: async () => "Build" as TicketPhase,
          getPhaseConfig: async () => phaseConfig,
          readQuestion: () => null,
          isPhaseAutomated: async () => false,
        },
      ),
    );
  });
});
