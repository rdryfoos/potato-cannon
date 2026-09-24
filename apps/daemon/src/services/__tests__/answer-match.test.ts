import { describe, it } from "node:test";
import assert from "node:assert";
import { matchesOfferedAnswer } from "../answer-match.js";

/**
 * Telling an answer from a remark.
 *
 * The input route took whatever arrived, wrote it as the answer to a suspended
 * worker's question and resumed the worker with it. On the second cold run Rik typed
 * "Buddy?" into the composer while BAN-1's worker was suspended; that became the
 * answer, the worker resumed on it, and the card went red.
 */
describe("what counts as answering the question that was asked", () => {
  const options = ["build on it", "replace it", "leave two paths"];

  it("takes one of the offered answers", () => {
    assert.strictEqual(matchesOfferedAnswer(options, "replace it"), true);
  });

  it("refuses the message that turned BAN-1 red", () => {
    assert.strictEqual(matchesOfferedAnswer(options, "Buddy?"), false);
  });

  it("refuses a remark that merely contains an option", () => {
    // "I would replace it, but ask me tomorrow" is a person thinking aloud, not a
    // choice. Treating it as one is how a worker resumes on something nobody decided.
    assert.strictEqual(matchesOfferedAnswer(options, "I would replace it, but ask me tomorrow"), false);
    assert.strictEqual(matchesOfferedAnswer(options, "replace it?"), false);
  });

  it("forgives the case and the spacing a person actually types", () => {
    assert.strictEqual(matchesOfferedAnswer(options, "  Replace It  "), true);
    assert.strictEqual(matchesOfferedAnswer(options, "BUILD ON IT"), true);
  });

  it("lets anything answer a question that offered nothing", () => {
    // A free-text question is a question in free text. Nothing to be outside of.
    assert.strictEqual(matchesOfferedAnswer(null, "whatever you think best"), true);
    assert.strictEqual(matchesOfferedAnswer(undefined, "Buddy?"), true);
    assert.strictEqual(matchesOfferedAnswer([], "Buddy?"), true);
  });

  it("refuses an empty message against a closed set", () => {
    assert.strictEqual(matchesOfferedAnswer(options, "   "), false);
  });
});
