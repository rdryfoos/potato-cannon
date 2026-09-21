import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  setBlock,
  getBlock,
  removeBlock,
  setLine,
  getLine,
  removeLine,
  applyEdit,
  assertName,
} from "../card-description.js";

// A real card, as the estate writes them.
const CARD = `ids: US-UI-10, FR-UI-10, AC-UI-10, AC-UI-20, AC-UI-30
Build the web app that design/ draws, over the same records file the command line writes. Read design/README.md first.

<!-- status:begin -->
2026-09-21T01:48:13Z  Spec entered from Ideas, by a hand, spudnik. Nothing to check.
2026-09-21T01:49:34Z  Build refused, the card stays in Spec, asked by the Cannon, on its own.
<!-- status:end -->
`;

describe("targeted block writes", () => {
  it("adds a block without touching a line of what was there", () => {
    const after = setBlock(CARD, "rework", "Change design/lend.html:14.");
    assert.ok(after.includes("ids: US-UI-10, FR-UI-10, AC-UI-10, AC-UI-20, AC-UI-30"));
    assert.ok(after.includes("Read design/README.md first."));
    assert.ok(after.includes("2026-09-21T01:49:34Z  Build refused"));
    assert.equal(getBlock(after, "rework"), "Change design/lend.html:14.");
    assert.equal(getBlock(after, "status"), getBlock(CARD, "status"));
  });

  it("replaces a block where it stands rather than moving it", () => {
    const after = setBlock(CARD, "status", "one line now");
    assert.equal(getBlock(after, "status"), "one line now");
    // Still below the prose, where it was, not hoisted to the top by a default.
    assert.ok(after.indexOf("ids:") < after.indexOf("<!-- status:begin -->"));
  });

  it("does not move an existing block just because `at` says otherwise", () => {
    const after = setBlock(CARD, "status", "replaced", "top");
    assert.ok(after.indexOf("ids:") < after.indexOf("<!-- status:begin -->"));
  });

  it("puts a new block at the top when asked, which is what a refusal needs", () => {
    const after = setBlock(CARD, "refusal", "the Gate said no", "top");
    assert.ok(after.indexOf("<!-- refusal:begin -->") < after.indexOf("ids:"));
  });

  it("removes a block and leaves no hole behind", () => {
    const after = removeBlock(CARD, "status");
    assert.equal(getBlock(after, "status"), null);
    assert.ok(after.includes("ids: US-UI-10"));
    assert.ok(!/\n{3,}/.test(after));
  });

  it("is unbothered by a block a person hand-edited the spacing of", () => {
    const messy = "prose\n\n<!--   rework:begin   -->\nsome detail\n<!--rework:end-->\n";
    assert.equal(getBlock(messy, "rework"), "some detail");
    const after = setBlock(messy, "rework", "new detail");
    assert.equal(getBlock(after, "rework"), "new detail");
    assert.ok(after.startsWith("prose"));
  });

  it("does not confuse two blocks whose names share a prefix", () => {
    let doc = setBlock("prose", "rework", "A");
    doc = setBlock(doc, "rework-notes", "B");
    assert.equal(getBlock(doc, "rework"), "A");
    assert.equal(getBlock(doc, "rework-notes"), "B");
    const after = setBlock(doc, "rework", "C");
    assert.equal(getBlock(after, "rework"), "C");
    assert.equal(getBlock(after, "rework-notes"), "B");
  });

  it("writes a block into an empty description", () => {
    assert.equal(getBlock(setBlock("", "rework", "x"), "rework"), "x");
  });

  it("refuses a name that could become markup", () => {
    for (const bad of ["<b>", "re work", "", "rework:begin", "-rework", "a".repeat(65)]) {
      assert.throws(() => assertName(bad), /not a usable name/);
    }
  });
});

describe("targeted line writes", () => {
  it("adds a line below the other lines and above any block", () => {
    const after = setLine(CARD, "pr", "https://github.com/x/y/pull/3");
    assert.equal(getLine(after, "pr"), "https://github.com/x/y/pull/3");
    assert.ok(after.indexOf("pr:") < after.indexOf("<!-- status:begin -->"));
    assert.equal(getLine(after, "ids"), "US-UI-10, FR-UI-10, AC-UI-10, AC-UI-20, AC-UI-30");
  });

  it("rewrites a line in place, keeping the order a reader is used to", () => {
    const once = setLine(CARD, "pr", "pull/3");
    const twice = setLine(once, "pr", "pull/4");
    assert.equal(getLine(twice, "pr"), "pull/4");
    assert.equal(once.split("\n").length, twice.split("\n").length);
    assert.equal(
      once.split("\n").indexOf("pr: pull/3"),
      twice.split("\n").indexOf("pr: pull/4"),
    );
  });

  it("changes nothing else when it rewrites one line", () => {
    const once = setLine(CARD, "blocked-reason", "AC-UI-30 has no source");
    const twice = setLine(once, "blocked-reason", "AC-UI-30 is now proven");
    assert.equal(
      once.replace("blocked-reason: AC-UI-30 has no source", "X"),
      twice.replace("blocked-reason: AC-UI-30 is now proven", "X"),
    );
  });

  it("never writes a line inside somebody's block", () => {
    const after = setLine(CARD, "pr", "pull/3");
    const begin = after.indexOf("<!-- status:begin -->");
    const end = after.indexOf("<!-- status:end -->");
    const prAt = after.indexOf("pr:");
    assert.ok(prAt < begin || prAt > end);
  });

  it("removes a line", () => {
    const after = removeLine(setLine(CARD, "pr", "pull/3"), "pr");
    assert.equal(getLine(after, "pr"), null);
    assert.equal(getLine(after, "ids"), "US-UI-10, FR-UI-10, AC-UI-10, AC-UI-20, AC-UI-30");
  });

  it("does not mistake one line for another that shares a prefix", () => {
    const doc = setLine(setLine("prose", "pr", "three"), "pr-draft", "four");
    assert.equal(getLine(doc, "pr"), "three");
    assert.equal(getLine(doc, "pr-draft"), "four");
  });
});

describe("applyEdit", () => {
  it("writes a block and a line in one pass and says what it changed", () => {
    const { description, changed } = applyEdit(CARD, {
      lines: [{ name: "pr", value: "pull/3" }],
      blocks: [{ name: "rework", text: "design/lend.html:14, the borrower field" }],
    });

    assert.equal(getLine(description, "pr"), "pull/3");
    assert.equal(getBlock(description, "rework"), "design/lend.html:14, the borrower field");
    assert.deepEqual(changed, ["line pr", "block rework"]);
    assert.equal(getBlock(description, "status"), getBlock(CARD, "status"));
  });

  it("reports nothing changed when nothing did", () => {
    const first = applyEdit(CARD, { lines: [{ name: "pr", value: "pull/3" }] });
    const again = applyEdit(first.description, { lines: [{ name: "pr", value: "pull/3" }] });
    assert.deepEqual(again.changed, []);
    assert.equal(again.description, first.description);
  });

  it("removes with a null, which is how a card stops being blocked", () => {
    const blocked = applyEdit(CARD, {
      lines: [{ name: "blocked-reason", value: "AC-UI-30 has no source" }],
    }).description;
    const cleared = applyEdit(blocked, { lines: [{ name: "blocked-reason", value: null }] });
    assert.equal(getLine(cleared.description, "blocked-reason"), null);
    assert.deepEqual(cleared.changed, ["line blocked-reason"]);
  });

  it("is idempotent, so a retry after a lost answer cannot double-write", () => {
    const edit = {
      lines: [{ name: "pr", value: "pull/3" }],
      blocks: [{ name: "rework", text: "one thing" }],
    };
    const once = applyEdit(CARD, edit).description;
    const twice = applyEdit(once, edit).description;
    assert.equal(once, twice);
  });
});
