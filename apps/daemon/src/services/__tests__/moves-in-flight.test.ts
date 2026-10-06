import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { beginMove, endMove, moveInFlight, refusalFor, type MoveInFlight } from "../moves-in-flight.js";

/**
 * One move at a time, per card.
 *
 * A move runs the target column's entry check first, and that check can take minutes:
 * Bang gives the Done check fifteen, because it runs a Gate. A second drag arriving in
 * that window ran its own check alongside the first, both wrote, and the card ended
 * wherever the slower one finished with no record that two people had asked for two
 * different things.
 */
const move = (toPhase: string, actor = "hand:rik"): MoveInFlight => ({
  toPhase,
  actor,
  since: "2026-10-06T10:00:00.000Z",
});

describe("beginMove", () => {
  it("gives the claim to the first caller", () => {
    const state = new Map();
    assert.equal(beginMove("BAN-1", move("Done"), state), null);
    assert.deepEqual(moveInFlight("BAN-1", state), move("Done"));
  });

  it("refuses the second, and hands back the one that holds it", () => {
    const state = new Map();
    beginMove("BAN-1", move("Done"), state);
    const held = beginMove("BAN-1", move("Build", "hand:someone-else"), state);
    assert.notEqual(held, null);
    assert.equal(held!.toPhase, "Done");
    assert.equal(held!.actor, "hand:rik");
  });

  it("holds per card, so another card is not blocked by this one", () => {
    const state = new Map();
    beginMove("BAN-1", move("Done"), state);
    assert.equal(beginMove("BAN-2", move("Build"), state), null);
  });

  it("gives the claim back, and the next caller gets it", () => {
    const state = new Map();
    beginMove("BAN-1", move("Done"), state);
    endMove("BAN-1", state);
    assert.equal(moveInFlight("BAN-1", state), null);
    assert.equal(beginMove("BAN-1", move("Build"), state), null);
  });

  it("ending a card that holds nothing is not an error", () => {
    const state = new Map();
    assert.doesNotThrow(() => endMove("BAN-9", state));
  });

  it("says who holds it and since when, because the refusal goes on the card", () => {
    const reason = refusalFor(move("Done"));
    assert.match(reason, /a move to Done is already running for this card/);
    assert.match(reason, /hand:rik/);
    assert.match(reason, /2026-10-06T10:00:00\.000Z/);
  });
});
