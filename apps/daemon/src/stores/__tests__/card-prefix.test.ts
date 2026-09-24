// A Cannon home of this run's own, before anything reads config/paths.js.
import { TEST_HOME } from "./helpers/test-home.js";
void TEST_HOME;

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";

import { getProjectPrefixFromDb, normaliseCardPrefix } from "../utils.js";

/**
 * The prefix a project's card ids carry.
 *
 * It was the first three alphanumerics of the display name, uppercased, with no way to
 * say otherwise. Two boards called "Bang (visual)" and "Bang (spare)" both derived BAN,
 * and because a card id is unique across the whole daemon rather than per project,
 * every card on both boards had to be created with its id passed by hand for weeks, on
 * pain of a collision.
 */
describe("a project's card prefix", () => {
  let dir: string;
  let db: Database.Database;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "card-prefix-"));
    db = new Database(path.join(dir, "test.db"));
    db.exec(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        display_name TEXT,
        slug TEXT,
        card_prefix TEXT
      );
    `);
    const insert = db.prepare(
      "INSERT INTO projects (id, display_name, slug, card_prefix) VALUES (?, ?, ?, ?)",
    );
    insert.run("visual", "Bang (visual)", "bang-visual", null);
    insert.run("spare", "Bang (spare)", "bang-spare", null);
    insert.run("visual-set", "Bang (visual)", "bang-visual", "BANV");
    insert.run("spare-set", "Bang (spare)", "bang-spare", "bans");
    insert.run("punctuated", "whatever", "whatever", "Bang (visual)");
    insert.run("cleared", "Bang (visual)", "bang-visual", "");
    insert.run("nameless", "", "", null);
  });

  after(() => {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("derives from the display name when the project has not chosen one", () => {
    assert.strictEqual(getProjectPrefixFromDb(db, "visual"), "BAN");
  });

  it("is the collision this exists for: two boards, one derived prefix", () => {
    assert.strictEqual(getProjectPrefixFromDb(db, "visual"), getProjectPrefixFromDb(db, "spare"));
  });

  it("uses the project's own prefix when it has one", () => {
    assert.strictEqual(getProjectPrefixFromDb(db, "visual-set"), "BANV");
    assert.strictEqual(getProjectPrefixFromDb(db, "spare-set"), "BANS");
  });

  it("and then the two boards no longer collide", () => {
    assert.notStrictEqual(
      getProjectPrefixFromDb(db, "visual-set"),
      getProjectPrefixFromDb(db, "spare-set"),
    );
  });

  it("cleans what a person types rather than refusing it", () => {
    assert.strictEqual(getProjectPrefixFromDb(db, "punctuated"), "BANGVISU");
    assert.strictEqual(normaliseCardPrefix("Bang (visual)"), "BANGVISU");
    assert.strictEqual(normaliseCardPrefix("banv"), "BANV");
  });

  it("treats an empty prefix as not set, so the old derivation comes back", () => {
    assert.strictEqual(getProjectPrefixFromDb(db, "cleared"), "BAN");
    assert.strictEqual(normaliseCardPrefix(""), null);
    assert.strictEqual(normaliseCardPrefix("   "), null);
    assert.strictEqual(normaliseCardPrefix("!!!"), null);
    assert.strictEqual(normaliseCardPrefix(null), null);
  });

  it("still falls back to TKT for a project with no name at all", () => {
    assert.strictEqual(getProjectPrefixFromDb(db, "nameless"), "TKT");
  });

  it("answers for a project that is not there, rather than throwing", () => {
    assert.strictEqual(getProjectPrefixFromDb(db, "no-such-project"), "TKT");
  });
});
