import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  QUEUED_LINE,
  clearQueueOnCard,
  drainQueuedMove,
  queueOnCard,
  queuedPhase,
  spawnDecision,
} from "../queued-move.js";
import { getLine } from "../card-description.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A move made while the card is busy.
 *
 * Moving a card into a phase with workers spawns one. If a session was already running,
 * the spawn was skipped with a line in the daemon's log and nothing else. The move was
 * not dropped: the card is in the new column and the board says so. What was missing is
 * the worker. On 2026-10-05 a hand dragged two cards into Build that way and both sat
 * there looking like work was coming.
 *
 * That is worse than a refused move, because the board is wrong rather than unchanged.
 * So the move is kept and the spawn is queued on the card, where it can be seen.
 */

const CARD = [
  "ids: US-UI-10, FR-UI-10",
  "branch: potato/BAN-1",
  "",
  "The story a person wrote.",
].join("\n");

const NOW = "2026-10-05T19:30:00.000Z";

describe("spawnDecision", () => {
  it("spawns when the phase has workers and nothing is running", () => {
    assert.equal(spawnDecision({ hasAutomation: true, activeSession: false }), "spawn");
  });

  it("queues when something is running, rather than skipping", () => {
    assert.equal(spawnDecision({ hasAutomation: true, activeSession: true }), "queue");
  });

  it("does nothing for a phase with no workers, running or not", () => {
    assert.equal(spawnDecision({ hasAutomation: false, activeSession: false }), "nothing");
    assert.equal(spawnDecision({ hasAutomation: false, activeSession: true }), "nothing");
  });
});

describe("the queue line on the card", () => {
  it("names the phase and says what it is waiting for", () => {
    const after = queueOnCard(CARD, "Build", NOW);
    const line = getLine(after, QUEUED_LINE);
    assert.ok(line, "no queue line was written");
    assert.match(line!, /^Build, waiting for the session running on this card to end/);
    assert.ok(line!.includes(NOW), "the line does not say since when");
  });

  it("leaves every other line and the story alone", () => {
    const after = queueOnCard(CARD, "Build", NOW);
    assert.equal(getLine(after, "ids"), "US-UI-10, FR-UI-10");
    assert.equal(getLine(after, "branch"), "potato/BAN-1");
    assert.ok(after.includes("The story a person wrote."));
  });

  it("reads back the phase, and nothing from a card with no queue", () => {
    assert.equal(queuedPhase(queueOnCard(CARD, "Build", NOW)), "Build");
    assert.equal(queuedPhase(CARD), null);
  });

  it("replaces rather than stacking, because a card waits in one place", () => {
    const twice = queueOnCard(queueOnCard(CARD, "Build", NOW), "Gate", NOW);
    assert.equal(queuedPhase(twice), "Gate");
    assert.equal(
      twice.split("\n").filter((l) => l.startsWith(QUEUED_LINE + ":")).length, 1);
  });

  it("comes off again", () => {
    assert.equal(queuedPhase(clearQueueOnCard(queueOnCard(CARD, "Build", NOW))), null);
  });
});

describe("drainQueuedMove", () => {
  const queued = queueOnCard(CARD, "Build", NOW);
  const always = async () => true;

  it("does nothing for a card with no queue", async () => {
    const r = await drainQueuedMove({
      description: CARD, activeSession: false, currentPhase: "Build", hasWorkers: always });
    assert.equal(r.action, "none");
  });

  it("spawns the queued phase and takes the line off", async () => {
    const r = await drainQueuedMove({
      description: queued, activeSession: false, currentPhase: "Build", hasWorkers: always });
    assert.equal(r.action, "spawn");
    if (r.action !== "spawn") return;
    assert.equal(r.phase, "Build");
    assert.equal(queuedPhase(r.description), null, "the line survived its own draining");
  });

  it("waits when another session started in between, and keeps the line", async () => {
    // Two sessions can end in a row. The line has to survive the first ending if the
    // second is still running, or the queued worker is lost exactly as before.
    const r = await drainQueuedMove({
      description: queued, activeSession: true, currentPhase: "Build", hasWorkers: always });
    assert.equal(r.action, "wait");
  });

  it("drops a queue for a phase the card has left", async () => {
    const r = await drainQueuedMove({
      description: queued, activeSession: false, currentPhase: "Review", hasWorkers: always });
    assert.equal(r.action, "drop");
    if (r.action !== "drop") return;
    assert.match(r.why, /the card is in Review now, not Build/);
    assert.equal(queuedPhase(r.description), null);
  });

  it("drops a queue for a phase that no longer has workers", async () => {
    // A template can change under a queued card, and a queue that cannot be acted on
    // has to come down or the card promises work that is never coming.
    const r = await drainQueuedMove({
      description: queued, activeSession: false, currentPhase: "Build",
      hasWorkers: async () => false });
    assert.equal(r.action, "drop");
    if (r.action !== "drop") return;
    assert.match(r.why, /Build has no workers any more/);
    assert.equal(queuedPhase(r.description), null);
  });
});

describe("the route and the drain, as the source has them", () => {
  // Source-reading, in the form buddy-pen.test.ts uses, because this repository has no
  // harness that spawns a pty or serves the express app. What is checked is that the
  // silent skip is gone and that the two halves are wired to each other.
  const src = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");

  it("the move no longer skips the spawn with only a log line", () => {
    const route = src("server/routes/tickets.routes.ts");
    assert.doesNotMatch(route, /already has an active session, skipping spawn/,
      "the silent skip is still there");
    assert.match(route, /spawnDecision\(\{/);
    assert.match(route, /queueOnCard\(/, "the route does not write the queue onto the card");
  });

  it("the end of a session is where the queue is drained", () => {
    const server = src("server/server.ts");
    const at = server.indexOf('"session:ended"');
    assert.ok(at > 0, "session:ended is not handled where this test thinks");
    assert.match(server.slice(at), /drainQueuedMove\(\{/);
    // And it re-asks whether a session is running, because another may have started.
    assert.match(server.slice(at), /activeSession: Boolean\(getActiveSessionForTicket\(ticketId\)\)/);
  });
});
