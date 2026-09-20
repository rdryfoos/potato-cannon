import { describe, it } from "node:test";
import assert from "node:assert";
import path from "path";
import {
  cardToken,
  parseCardToken,
  worktreePathFor,
  resolveInWorktree,
} from "../routes/thread.routes.js";

describe("card tokens", () => {
  it("round-trips a project id and a ticket id", () => {
    const token = cardToken("bang", "BAN-1");
    assert.deepStrictEqual(parseCardToken(token), { projectId: "bang", ticketId: "BAN-1" });
  });

  it("round-trips a project id containing a slash", () => {
    const token = cardToken("rdryfoos/potato-cannon", "BAN-1");
    assert.deepStrictEqual(parseCardToken(token), {
      projectId: "rdryfoos/potato-cannon",
      ticketId: "BAN-1",
    });
  });

  it("refuses a real filesystem path", () => {
    // What an unrewritten manifest carries. It must not be mistaken for a card.
    assert.strictEqual(parseCardToken("/Users/someone/work/repo"), null);
    assert.strictEqual(parseCardToken("/home/claude/ij"), null);
  });

  it("refuses the malformed and the missing", () => {
    assert.strictEqual(parseCardToken(undefined), null);
    assert.strictEqual(parseCardToken(""), null);
    assert.strictEqual(parseCardToken("potato:"), null);
    assert.strictEqual(parseCardToken("potato:bang"), null);
    assert.strictEqual(parseCardToken("potato:bang/"), null);
    assert.strictEqual(parseCardToken("potato:/BAN-1"), null);
    assert.strictEqual(parseCardToken("bang/BAN-1"), null);
  });
});

describe("worktree resolution", () => {
  const worktree = worktreePathFor("/projects/bang", "BAN-1");

  it("puts a card's worktree where ensureWorktree puts it", () => {
    assert.strictEqual(worktree, path.join("/projects/bang", ".potato", "worktrees", "BAN-1"));
  });

  it("resolves a path inside the worktree", () => {
    assert.strictEqual(
      resolveInWorktree(worktree, "src/main.ts"),
      path.join(worktree, "src/main.ts"),
    );
  });

  it("resolves a path that walks down and back up but stays inside", () => {
    assert.strictEqual(
      resolveInWorktree(worktree, "src/../src/main.ts"),
      path.join(worktree, "src/main.ts"),
    );
  });

  it("refuses a path that climbs out", () => {
    assert.strictEqual(resolveInWorktree(worktree, "../../../etc/passwd"), null);
    assert.strictEqual(resolveInWorktree(worktree, ".."), null);
    assert.strictEqual(resolveInWorktree(worktree, "src/../../BAN-2/secret.txt"), null);
  });

  it("refuses an absolute path", () => {
    assert.strictEqual(resolveInWorktree(worktree, "/etc/passwd"), null);
  });

  it("refuses a path that resolves to the worktree itself", () => {
    assert.strictEqual(resolveInWorktree(worktree, "."), null);
    assert.strictEqual(resolveInWorktree(worktree, ""), null);
  });

  it("refuses a sibling worktree whose name merely starts the same", () => {
    // path.relative would give "../BAN-10/x" here, so the ".." check catches it,
    // but the case is worth pinning: BAN-1 and BAN-10 are different cards.
    assert.strictEqual(resolveInWorktree(worktree, "../BAN-10/x"), null);
  });
});
