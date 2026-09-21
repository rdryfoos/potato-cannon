import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { renderTranscript } from "../transcript.js";
import type { ConversationMessage } from "../../types/conversation.types.js";

function msg(
  type: ConversationMessage["type"],
  text: string,
  speaker?: { kind: ConversationMessage["speaker"] extends undefined ? never : "person" | "worker" | "buddy" | "cannon"; name: string },
  metadata?: Record<string, unknown>,
): ConversationMessage {
  return {
    id: Math.random().toString(36).slice(2),
    conversationId: "c1",
    type,
    text,
    timestamp: new Date().toISOString(),
    ...(speaker ? { speaker } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

const THREAD: ConversationMessage[] = [
  msg("question", "Who builds the date-back write, A, B or C?", { kind: "worker", name: "Spec worker" }),
  msg("user", "A. Defaults accepted.", { kind: "person", name: "You" }),
  msg("notification", "Spec written to specs/004-screens/spec.md.", { kind: "worker", name: "Spec worker" }),
  msg("notification", "Ticket blocked automatically: entry check exited 1", { kind: "cannon", name: "Cannon" }),
  msg("question", "AC-UI-30 reads tracked-debt on this branch.", { kind: "buddy", name: "Buddy" }),
];

describe("renderTranscript", () => {
  it("renders a script with the speaker of every line named", () => {
    const out = renderTranscript(THREAD);
    assert.match(out, /^Spec worker: Who builds the date-back write, A, B or C\?$/m);
    assert.match(out, /^You: A\. Defaults accepted\.$/m);
    assert.match(out, /^Cannon: Ticket blocked automatically: entry check exited 1$/m);
    assert.match(out, /^Buddy: AC-UI-30 reads tracked-debt on this branch\.$/m);
  });

  it("keeps the thread in the order it happened", () => {
    const out = renderTranscript(THREAD);
    assert.ok(out.indexOf("Who builds the date-back write") < out.indexOf("A. Defaults accepted."));
    assert.ok(out.indexOf("A. Defaults accepted.") < out.indexOf("AC-UI-30 reads tracked-debt"));
  });

  it("tells two workers apart, which is the whole reason this is worth sending", () => {
    const out = renderTranscript([
      msg("question", "one", { kind: "worker", name: "Spec worker" }),
      msg("question", "two", { kind: "worker", name: "Build worker" }),
      msg("notification", "three", { kind: "worker", name: "Gate runner" }),
    ]);
    assert.match(out, /Spec worker: one/);
    assert.match(out, /Build worker: two/);
    assert.match(out, /Gate runner: three/);
  });

  it("says plainly when there is nothing to show", () => {
    assert.equal(renderTranscript([]), "(nothing has been said on this card yet)");
  });

  it("keeps the newest messages and says how many it dropped", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      msg("notification", `line ${i}`, { kind: "worker", name: "Build worker" }),
    );
    const out = renderTranscript(many, { maxMessages: 3 });

    assert.match(out, /line 7/);
    assert.match(out, /line 8/);
    assert.match(out, /line 9/);
    assert.ok(!out.includes("line 6"));
    assert.match(out, /The 7 message\(s\) before these are not shown/);
  });

  it("tells the agent its view is partial, so it can say so instead of answering anyway", () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      msg("notification", `line ${i}`, { kind: "cannon", name: "Cannon" }),
    );
    const out = renderTranscript(many, { maxMessages: 2 });
    assert.match(out, /This is the end of the thread, not all of it/);
    assert.match(out, /say so if the answer depends on what came earlier/);
  });

  it("does not let one long message eat the budget", () => {
    const out = renderTranscript(
      [
        msg("notification", "x".repeat(5000), { kind: "worker", name: "Gate runner" }),
        msg("user", "and what did that say?", { kind: "person", name: "You" }),
      ],
      { maxCharsPerMessage: 100 },
    );
    assert.match(out, /\[\.\.\. 4900 more characters, not shown\]/);
    assert.match(out, /You: and what did that say\?/);
  });

  it("keeps at least the newest message even when it alone blows the ceiling", () => {
    const out = renderTranscript(
      [
        msg("notification", "old", { kind: "cannon", name: "Cannon" }),
        msg("user", "y".repeat(400), { kind: "person", name: "You" }),
      ],
      { maxChars: 50, maxCharsPerMessage: 1000 },
    );
    assert.match(out, /^You: y+/m);
    assert.ok(!out.includes("Cannon: old"));
  });

  it("indents a message that wraps, so the next speaker's name starts a line", () => {
    const out = renderTranscript([
      msg("question", "first line\nsecond line", { kind: "worker", name: "Spec worker" }),
      msg("user", "ok", { kind: "person", name: "You" }),
    ]);
    const lines = out.split("\n");
    assert.equal(lines[0], "Spec worker: first line");
    assert.equal(lines[1], "             second line");
    assert.equal(lines[3], "You: ok");
  });

  it("names an artifact rather than pretending it had text", () => {
    const out = renderTranscript([
      msg("artifact", "", { kind: "worker", name: "Build worker" }, { artifact: { filename: "review.md" } }),
    ]);
    assert.equal(out, "Build worker: attached review.md");
  });

  it("falls back rather than dropping a message written before speakers existed", () => {
    const out = renderTranscript([
      msg("user", "typed before V16"),
      msg("question", "asked before V16"),
    ]);
    assert.match(out, /You: typed before V16/);
    assert.match(out, /A worker: asked before V16/);
  });
});
