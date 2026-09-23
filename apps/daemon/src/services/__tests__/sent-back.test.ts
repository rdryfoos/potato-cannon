import { describe, it } from "node:test";
import assert from "node:assert";
import { setLine, getLine } from "../card-description.js";

/**
 * A card sent backwards says so on itself.
 *
 * The history tab records every move and nobody reads it before starting work: the
 * Build worker reads the card. A card arriving in Build for the second time looked
 * exactly like one arriving for the first, and the worker's only clue that a person
 * sent it back was a Rework block somebody may or may not have written.
 *
 * These assert the shape of the line the PUT handler writes, against the same
 * setLine the handler calls, so a change to targeted writes shows up here.
 */
const sentBack = (description: string, from: string, to: string, actor: string, when: string) =>
  setLine(description, "sent-back", `from ${from} to ${to} by ${actor} on ${when}`);

describe("the sent-back line", () => {
  const when = "2026-09-23T21:40:00.000Z";

  it("names where the card came from, where it went, who moved it and when", () => {
    const out = sentBack("Lend and return in the browser.", "Align", "Build", "a hand", when);
    assert.strictEqual(getLine(out, "sent-back"), `from Align to Build by a hand on ${when}`);
  });

  it("leaves every other line of the card where it was", () => {
    const before = [
      "ids: US-UI-10, FR-UI-10",
      "Drag this card to Spec and watch what happens.",
      "try: route /",
    ].join("\n");
    const after = sentBack(before, "Align", "Build", "a hand", when);

    assert.strictEqual(getLine(after, "ids"), "US-UI-10, FR-UI-10");
    assert.strictEqual(getLine(after, "try"), "route /");
    assert.ok(after.includes("Drag this card to Spec and watch what happens."));
  });

  it("replaces the last one rather than stacking, so the card says where it is now", () => {
    // A card can go round more than once. The line is the state of the card, not a log:
    // the log is the history tab, and a card with four sent-back lines is a card whose
    // first line a reader has to work out the age of.
    const once = sentBack("", "Align", "Build", "a hand", when);
    const twice = sentBack(once, "Gate", "Build", "a hand", "2026-09-24T09:00:00.000Z");

    assert.strictEqual(
      getLine(twice, "sent-back"),
      "from Gate to Build by a hand on 2026-09-24T09:00:00.000Z",
    );
    assert.strictEqual(twice.split("sent-back:").length - 1, 1, "only one sent-back line");
  });

  it("is written onto a card that had no description at all", () => {
    const out = sentBack("", "Align", "Build", "a hand", when);
    assert.strictEqual(getLine(out, "sent-back"), `from Align to Build by a hand on ${when}`);
  });
});
