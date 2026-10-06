import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { checkCardIds, idsNotIn, parseIdsLine, registryPathFor } from "../card-ids.js";

/**
 * A card may not claim an id the project's registry does not name.
 *
 * Nothing checked. A typo, a renamed ID, or an ID copied from another project made a
 * card that looked exactly like a real one, and the first thing to notice was the Gate,
 * several columns and one worker's run later.
 */

let dir: string;

function project(files: Record<string, string>): string {
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, "utf-8");
  }
  return dir;
}

const REGISTRY = [
  "# Registry",
  "- US-LEND-10 — As the owner, I write down what I lent.",
  "  - AC-LEND-10 — An item saved appears in the list.",
  "  - AC-UI-10 — Opening the app shows the outstanding list.",
].join("\n");

describe("the ids a card claims", () => {
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "cardids-")); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("reads the ids line, whatever punctuation is around them", () => {
    assert.deepEqual(
      parseIdsLine("ids: US-LEND-10, AC-LEND-10\n\nThe story."),
      ["US-LEND-10", "AC-LEND-10"]);
    assert.deepEqual(parseIdsLine("ids: `AC-UI-10`"), ["AC-UI-10"]);
    assert.deepEqual(parseIdsLine("Ids:  AC-UI-10 ; US-LEND-10"), ["AC-UI-10", "US-LEND-10"]);
  });

  it("treats a card with no ids line, and `ids: none`, as claiming nothing", () => {
    // `none` is the same word `**Carries**: none` uses for a line that carries no
    // promise, and it means the same thing here.
    assert.deepEqual(parseIdsLine("Just a card."), []);
    assert.deepEqual(parseIdsLine("ids: none"), []);
    assert.deepEqual(parseIdsLine("ids: None"), []);
  });

  it("matches whole ids only", () => {
    // AC-UI-1 must not pass on the strength of AC-UI-10.
    assert.deepEqual(idsNotIn(REGISTRY, ["AC-UI-10"]), []);
    assert.deepEqual(idsNotIn(REGISTRY, ["AC-UI-1"]), ["AC-UI-1"]);
  });

  it("takes the registry's path from SpecAssay's own config", () => {
    const root = project({
      "docs/promises.md": REGISTRY,
      ".specify/extensions/specassay-check/specassay-check-config.yml":
        'registry: "docs/promises.md"\n',
    });
    assert.equal(registryPathFor(root), path.join(root, "docs/promises.md"));
  });

  it("falls back to PRD.md when there is no config", () => {
    const root = project({ "PRD.md": REGISTRY });
    assert.equal(registryPathFor(root), path.join(root, "PRD.md"));
  });

  it("refuses a card naming an id the registry does not have, and says which", () => {
    const root = project({ "PRD.md": REGISTRY });
    const check = checkCardIds(root, "ids: AC-LEND-10, AC-TYPO-99, AC-UI-10");
    assert.equal(check.ok, false);
    assert.deepEqual(check.missing, ["AC-TYPO-99"]);
  });

  it("allows a card whose ids are all in the registry", () => {
    const root = project({ "PRD.md": REGISTRY });
    assert.equal(checkCardIds(root, "ids: AC-LEND-10, AC-UI-10").ok, true);
  });

  it("allows, and says why, when there is no registry to ask", () => {
    // Refusing a card because a file is missing would stop a project before it has one.
    const root = project({ "README.md": "nothing here" });
    const check = checkCardIds(root, "ids: AC-UI-10");
    assert.equal(check.ok, true);
    assert.match(check.skipped ?? "", /no registry file/);
  });

  it("allows when the project has no path on disk", () => {
    const check = checkCardIds(undefined, "ids: AC-UI-10");
    assert.equal(check.ok, true);
    assert.match(check.skipped ?? "", /no path on disk/);
  });
});
