import { TEST_HOME } from "./helpers/test-home.js";
void TEST_HOME;

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";

import { createTicketStore } from "../ticket.store.js";
import { runMigrations } from "../migrations.js";

/**
 * A move that did not happen.
 *
 * ticket_history recorded transitions, and a refusal is the one thing that is not one:
 * the check says no, the card stays where it is, and nothing anywhere recorded that
 * anybody tried. On 2026-09-24 a card whose work was finished and green was refused
 * promotion, and the only trace was a 409 in a response body the board threw away. A
 * reader opening the card an hour later saw it sitting in Gate for no stated reason.
 */
describe("a refused move on the card's history", () => {
  let dir: string;
  let db: Database.Database;
  let store: ReturnType<typeof createTicketStore>;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "refusal-history-"));
    db = new Database(path.join(dir, "test.db"));
    runMigrations(db);
    store = createTicketStore(db);
    // ticket_history references tickets(id), so the card has to exist. It is in Gate,
    // which is where it stays: the point of a refusal is that the card did not move.
    db.prepare(
      `INSERT INTO projects (id, path, display_name, slug, registered_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run("bang", "/tmp/bang", "Bang", "bang", "2026-09-24T08:00:00.000Z");
    db.prepare(
      `INSERT INTO tickets (id, project_id, title, phase, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run("BAN-1", "bang", "Lend and return in the browser", "Gate",
          "2026-09-24T08:00:00.000Z", "2026-09-24T09:00:00.000Z");
    db.prepare(
      `INSERT INTO ticket_history (id, ticket_id, phase, entered_at) VALUES (?, ?, ?, ?)`,
    ).run("h1", "BAN-1", "Gate", "2026-09-24T09:00:00.000Z");
  });

  after(() => {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("records what was attempted, why it was refused, and by whom", () => {
    store.recordRefusal("BAN-1", "Align", "branch potato/BAN-1 at 213f8b6 does not exist", "hand:rik");

    const refusal = store.getTicketHistory("BAN-1").find((e) => e.refused);
    assert.ok(refusal, "expected a refusal on the history");
    assert.strictEqual(refusal.phase, "Align");
    assert.match(String(refusal.reason), /does not exist/);
    assert.strictEqual(refusal.actor, "hand:rik");
  });

  it("is a point, not a span: nothing was entered", () => {
    const refusal = store.getTicketHistory("BAN-1").find((e) => e.refused);
    assert.strictEqual(refusal?.at, refusal?.endedAt);
  });

  it("leaves the card where it was, with its real history intact", () => {
    const history = store.getTicketHistory("BAN-1");
    const real = history.filter((e) => !e.refused);
    assert.strictEqual(real.length, 1);
    assert.strictEqual(real[0].phase, "Gate");
    assert.strictEqual(real[0].refused, undefined);
  });

  it("does not close the open phase the card is actually in", () => {
    // The card did not leave Gate. A refusal that closed the current row would make
    // the card's own history say it went somewhere.
    const open = store.getCurrentHistoryEntry("BAN-1");
    assert.strictEqual(open?.entry.phase, "Gate");
    assert.strictEqual(open?.entry.endedAt, undefined);
  });
});
