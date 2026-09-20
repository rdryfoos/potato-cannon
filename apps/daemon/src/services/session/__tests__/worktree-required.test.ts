import { strict as assert } from "node:assert";
import { after, describe, it } from "node:test";
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { ensureWorktree } from "../worktree.js";

/**
 * A phase that declares requiresWorktree gets a worktree or gets nothing.
 *
 * ensureWorktree used to answer a failure by returning the project's own path, so the
 * daemon started the session anyway, in the primary checkout, on the default branch.
 * An agent there commits to main with no branch, no review and no promotion. In the run
 * that found this, the only thing that kept main clean was an agent noticing where it
 * was and declining to work.
 */

const made: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "worktree-required-"));
  made.push(dir);
  return dir;
}

after(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

describe("ensureWorktree", () => {
  it("throws rather than handing back the project's own checkout", async () => {
    const notARepo = tempDir();
    await assert.rejects(
      () => ensureWorktree(notARepo, "CARD-1", "potato"),
      (error: Error) => {
        assert.match(error.message, /Failed to create worktree for CARD-1/);
        return true;
      },
    );
  });

  it("never returns the project path on failure", async () => {
    const notARepo = tempDir();
    let returned: string | null = null;
    try {
      returned = await ensureWorktree(notARepo, "CARD-2", "potato");
    } catch {
      returned = null;
    }
    assert.equal(returned, null, "a failed worktree must not resolve to the project path");
  });

  it("creates the worktree on its own branch when the project is a repository", async () => {
    const dir = tempDir();
    const run = (cmd: string) => execSync(cmd, { cwd: dir, stdio: "pipe" });
    run("git init -q");
    run("git config user.email t@t");
    run("git config user.name t");
    run("git commit -q --allow-empty -m first");
    run("git branch -M main");

    const worktree = await ensureWorktree(dir, "CARD-3", "potato");

    assert.equal(worktree, path.join(dir, ".potato", "worktrees", "CARD-3"));
    assert.ok(existsSync(path.join(worktree, ".git")));
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: worktree, encoding: "utf-8" }).trim();
    assert.equal(branch, "potato/CARD-3");
  });
});
