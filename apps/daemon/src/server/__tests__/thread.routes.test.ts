import { describe, it } from "node:test";
import assert from "node:assert";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import {
  cardToken,
  parseCardToken,
  worktreeHead,
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

describe("the commit a thread picture describes", () => {
  // The Thread tab reads a worktree's manifest live off disk, so it shows whatever the
  // last Gate run there left behind. The manifest says when it was generated and never
  // which commit it is of. This is that missing half, and it is read from the worktree
  // rather than from the manifest, because the manifest is the thing being dated.
  const git = (cwd: string, ...args: string[]) =>
    execFileSync("git", args, { cwd, encoding: "utf-8", stdio: "pipe" }).trim();

  it("reads the head of a real worktree", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "thread-head-"));
    try {
      git(dir, "init", "-q");
      git(dir, "config", "user.email", "t@t");
      git(dir, "config", "user.name", "t");
      fs.writeFileSync(path.join(dir, "a.txt"), "one\n");
      git(dir, "add", "-A");
      git(dir, "commit", "-qm", "one", "--no-verify");

      const expected = git(dir, "rev-parse", "HEAD");
      assert.strictEqual(await worktreeHead(dir), expected);
      assert.match(String(await worktreeHead(dir)), /^[0-9a-f]{40}$/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("moves with the worktree rather than being read once", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "thread-head-"));
    try {
      git(dir, "init", "-q");
      git(dir, "config", "user.email", "t@t");
      git(dir, "config", "user.name", "t");
      fs.writeFileSync(path.join(dir, "a.txt"), "one\n");
      git(dir, "add", "-A");
      git(dir, "commit", "-qm", "one", "--no-verify");
      const first = await worktreeHead(dir);

      fs.writeFileSync(path.join(dir, "a.txt"), "two\n");
      git(dir, "add", "-A");
      git(dir, "commit", "-qm", "two", "--no-verify");
      const second = await worktreeHead(dir);

      assert.notStrictEqual(first, second, "a second commit must change the answer");
      assert.strictEqual(second, git(dir, "rev-parse", "HEAD"));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("answers null rather than throwing when there is nothing to read", async () => {
    // A card with no worktree, and a repository with no commits, both still get their
    // manifest; the tab says it does not know which commit, which is true.
    const missing = path.join(os.tmpdir(), "thread-head-does-not-exist-" + Date.now());
    assert.strictEqual(await worktreeHead(missing), null);

    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "thread-head-empty-"));
    try {
      git(empty, "init", "-q");
      assert.strictEqual(await worktreeHead(empty), null);
    } finally {
      fs.rmSync(empty, { recursive: true, force: true });
    }
  });
});
