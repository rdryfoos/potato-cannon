import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { runEntryCheck } from "../entry-check.js";
import type { EntryCheck } from "../../../types/template.types.js";

/**
 * Every phase transition says who caused it.
 *
 * Three kinds, and the reason all three matter: a hand's decision, the daemon advancing
 * a card on its own, and a named hook acting for the estate. Before 2026-09-20 the
 * history recorded only that a card moved, and an entry check could not tell which of
 * the three was asking. The check is told now, in POTATO_ACTOR.
 *
 * These run a real command and read what it saw in its environment, because what is
 * being tested is what the command is handed.
 */

const echoActor: EntryCheck = {
  command: ["/bin/sh", "-c", 'printf "actor=%s from=%s to=%s" "$POTATO_ACTOR" "$POTATO_FROM_PHASE" "$POTATO_TO_PHASE"'],
  timeoutSeconds: 20,
};

function ctx(actor?: string) {
  return {
    projectId: "p1",
    projectPath: process.cwd(),
    ticketId: "CARD-1",
    fromPhase: "Gate",
    toPhase: "Review",
    actor,
  };
}

describe("the actor a transition carries", () => {
  it("hands a hand's name to the check", async () => {
    const result = await runEntryCheck(echoActor, ctx("hand:spudnik"));
    assert.equal(result.allowed, true);
    assert.equal(result.reason, "actor=hand:spudnik from=Gate to=Review");
  });

  it("hands the daemon's own name to the check when it advances a card itself", async () => {
    const result = await runEntryCheck(echoActor, ctx("auto"));
    assert.equal(result.allowed, true);
    assert.match(result.reason, /actor=auto\b/);
  });

  it("hands a hook's name to the check", async () => {
    const result = await runEntryCheck(echoActor, ctx("hook:promote-to-done"));
    assert.equal(result.allowed, true);
    assert.match(result.reason, /actor=hook:promote-to-done\b/);
  });

  it("passes an empty actor rather than inventing one", async () => {
    const result = await runEntryCheck(echoActor, ctx(undefined));
    assert.equal(result.reason, "actor= from=Gate to=Review");
  });

  it("still refuses on a nonzero exit, whoever is asking", async () => {
    const refuse: EntryCheck = {
      command: ["/bin/sh", "-c", 'echo "no, said to $POTATO_ACTOR" >&2; exit 1'],
      timeoutSeconds: 20,
    };
    const result = await runEntryCheck(refuse, ctx("auto"));
    assert.equal(result.allowed, false);
    assert.match(result.reason, /no, said to auto/);
  });
});
