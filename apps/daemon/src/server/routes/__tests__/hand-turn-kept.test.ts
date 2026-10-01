import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A hand's turn to a worker is kept the way a hand's turn to Buddy is.
 *
 * On the Linux run a person typed into the composer while the Build worker was running.
 * It reached the worker and the worker acted on it, and after a reload the person's half
 * of the exchange was not in the feed. Buddy's was. Two channels, two different ideas of
 * what a turn is.
 *
 * Buddy's route writes the turn to the conversation before it spawns anything
 * (ticket-chat.routes.ts). `/input` wrote it only when the message was conversation
 * rather than an answer: on the answer path the text went into pending_questions, which
 * holds one answer, is consumed by the resume and then cleared. Nothing was lost that
 * the worker needed; what was lost is the record that a person had spoken.
 *
 * From the source tree by cwd, because these tests run out of dist/ where there is no
 * .ts beside them. Same form as buddy-pen.test.ts, for the same reason.
 */
const src = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");

describe("the hand's turn, on both channels", () => {
  const input = src("server/routes/tickets.routes.ts");
  const buddy = src("server/routes/ticket-chat.routes.ts");

  it("Buddy's route still writes the person's turn to the conversation", () => {
    assert.match(
      buddy,
      /addMessage\(conversationId, \{ type: "user", text: message, speaker \}\)/,
    );
  });

  it("the answer path writes the person's turn before it answers the worker", () => {
    const at = input.indexOf("writeResponse(projectId, ticketId, { answer: message })");
    assert.ok(at > 0, "the answer path is not where this test thinks it is");
    // The window above the write, not the whole file: an addMessage somewhere else in a
    // 900-line route file is not this path keeping a record.
    const before = input.slice(Math.max(0, at - 900), at);
    assert.match(before, /addMessage\(ticket\.conversationId, \{/);
    assert.match(before, /type: "user"/);
    assert.match(before, /speaker: \{ kind: "person", name: "You" \}/);
  });

  it("the conversation path still writes it too", () => {
    // The branch that was already right. Both branches or neither: a reader cannot tell
    // from the composer which one their sentence took.
    const matches = input.match(/addMessage\(ticket\.conversationId, \{\n\s+type: "user",/g);
    assert.ok(
      matches && matches.length >= 2,
      `expected both /input branches to record the turn, found ${matches?.length ?? 0}`,
    );
  });
});
