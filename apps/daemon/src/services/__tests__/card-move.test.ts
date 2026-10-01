import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { descriptionForMove } from "../card-move.js";
import { getLine } from "../card-description.js";

const PHASES = ["Ideas", "Spec", "Build", "Gate", "Review", "Done"];
const NOW = () => "2026-10-01T09:00:00.000Z";

const CARD = [
  "ids: US-UI-10, FR-UI-10",
  "branch: potato/BAN-1",
  "blocked-reason: T908 carries no registry ID and the Gate reads Carries as a claim",
  "",
  "The story a person wrote.",
].join("\n");

function move(oldPhase: string, newPhase: string, description = CARD) {
  return descriptionForMove({
    description,
    oldPhase,
    newPhase,
    actor: "hand:rik",
    phases: PHASES,
    now: NOW,
  });
}

describe("descriptionForMove", () => {
  it("clears a blocked-reason when the card leaves Build, going forwards", () => {
    const after = move("Build", "Gate");
    assert.notEqual(after, null);
    assert.equal(getLine(after!, "blocked-reason"), null);
    // Everything else the card carries is still there.
    assert.equal(getLine(after!, "branch"), "potato/BAN-1");
    assert.equal(getLine(after!, "ids"), "US-UI-10, FR-UI-10");
    assert.ok(after!.includes("The story a person wrote."));
  });

  it("clears it going backwards too, and still says the card was sent back", () => {
    const after = move("Build", "Spec");
    assert.notEqual(after, null);
    assert.equal(getLine(after!, "blocked-reason"), null);
    assert.equal(
      getLine(after!, "sent-back"),
      "from Build to Spec by hand:rik on 2026-10-01T09:00:00.000Z",
    );
  });

  it("leaves a blocked-reason alone while the card is still in Build", () => {
    assert.equal(move("Build", "Build"), null);
  });

  it("does not touch a blocked-reason written on a card leaving another column", () => {
    // Review to Done does not pass through Build, so the line is not this move's to
    // clear. A card that reaches Review carrying one got it cleared on the way out.
    const after = move("Review", "Done");
    assert.equal(after, null);
  });

  it("writes nothing when there is nothing to write", () => {
    const plain = "ids: US-UI-10\nbranch: potato/BAN-2\n";
    assert.equal(move("Build", "Gate", plain), null);
    assert.equal(move("Spec", "Build", plain), null);
  });

  it("starts from an edit arriving in the same call, not from the stored card", () => {
    // The route passes the description the PATCH carries when it carries one. A move
    // that rebuilt from the stored card would drop the hand's edit on the floor.
    const edited = CARD + "\n\nA sentence the hand added in the same request.";
    const after = move("Build", "Spec", edited);
    assert.ok(after!.includes("A sentence the hand added in the same request."));
    assert.equal(getLine(after!, "blocked-reason"), null);
  });

  it("is told the time rather than reading it, so the line can be checked", () => {
    const after = move("Gate", "Build");
    assert.ok(after!.includes("2026-10-01T09:00:00.000Z"));
  });
});
