import { strict as assert } from "node:assert";
import { after, describe, it } from "node:test";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { findTryScript, runTryScript, TRY_SCRIPTS, TRY_TIMEOUT_SECONDS } from "../routes/try.routes.js";

/**
 * Try it runs one file and no other.
 *
 * The property worth testing is not that a script runs, which is easy, but that
 * nothing a caller sends can change what runs. The route takes a card id and computes
 * the worktree itself; this covers the half below that, where a worktree is handed in
 * and exactly the project's own try script inside it is executed, with no arguments
 * and no shell.
 */

const made: string[] = [];

function worktree(script?: string, folder = "robots"): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "try-route-"));
  made.push(dir);
  if (script !== undefined) {
    mkdirSync(path.join(dir, folder), { recursive: true });
    const file = path.join(dir, folder, "try.sh");
    writeFileSync(file, script);
    chmodSync(file, 0o755);
  }
  return dir;
}

after(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

describe("runTryScript", () => {
  it("runs robots/try.sh and returns what it said", async () => {
    const dir = worktree('#!/bin/sh\necho "the list ran"\n');
    const result = await runTryScript(dir);
    assert.equal(result.ran, true);
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /the list ran/);
    assert.equal(result.script, "robots/try.sh");
  });

  it("hands back the script's own exit code rather than flattening it", async () => {
    const dir = worktree('#!/bin/sh\necho "broken" >&2\nexit 3\n');
    const result = await runTryScript(dir);
    assert.equal(result.ran, true);
    assert.equal(result.exitCode, 3);
    assert.match(result.stderr, /broken/);
  });

  it("says so plainly when the branch has no try script", async () => {
    const result = await runTryScript(worktree());
    assert.equal(result.ran, false);
    assert.equal(result.exitCode, null);
    assert.match(result.reason ?? "", /no robots\/try\.sh/);
  });

  it("runs it with no arguments at all", async () => {
    const dir = worktree('#!/bin/sh\necho "argc=$#"\n');
    const result = await runTryScript(dir);
    assert.match(result.stdout, /argc=0/);
  });

  it("runs the script in the worktree, not wherever the daemon happens to be", async () => {
    const dir = worktree('#!/bin/sh\npwd\n');
    const result = await runTryScript(dir);
    // macOS reports /private/var for /var, so compare the tail rather than the string.
    assert.ok(result.stdout.trim().endsWith(path.basename(dir)), result.stdout);
  });

  it("executes a path it computed, never a command line", async () => {
    const dir = worktree('#!/bin/sh\necho ok\n');
    let sawArgs: readonly string[] | undefined;
    let sawFile: string | undefined;
    const fakeExec = ((file: string, args: string[], _opts: unknown, cb: Function) => {
      sawFile = file;
      sawArgs = args;
      cb(null, "", "");
      return {} as never;
    }) as unknown as typeof import("child_process").execFile;

    await runTryScript(dir, fakeExec);
    assert.equal(sawFile, path.join(dir, "robots", "try.sh"));
    assert.deepEqual(sawArgs, []);
  });

  it("keeps a timeout, so a card cannot hold the daemon open", () => {
    assert.ok(TRY_TIMEOUT_SECONDS > 0 && TRY_TIMEOUT_SECONDS <= 600);
  });
});

/**
 * Which folder the try script is in.
 *
 * It was `robots/try.sh` and nothing else. The project this button was built for
 * renamed that folder to `scripts/` on 2026-09-21, because "robot" is not a word its
 * readers were meant to meet, and Try it has pointed at a path that project no longer
 * has ever since: the button answered "this card's branch has no robots/try.sh", which
 * is true and useless.
 */
describe("where the try script lives", () => {
  it("finds scripts/try.sh, which is what Bang ships today", () => {
    const dir = worktree("#!/bin/sh\necho from scripts\n", "scripts");
    assert.equal(findTryScript(dir), path.join("scripts", "try.sh"));
  });

  it("still finds robots/try.sh, so a project that renamed nothing is untouched", () => {
    const dir = worktree("#!/bin/sh\necho from robots\n", "robots");
    assert.equal(findTryScript(dir), path.join("robots", "try.sh"));
  });

  it("prefers scripts/ when a worktree carries both", () => {
    // A project mid-rename. The newer name is the one it meant.
    const dir = worktree("#!/bin/sh\necho from scripts\n", "scripts");
    mkdirSync(path.join(dir, "robots"), { recursive: true });
    writeFileSync(path.join(dir, "robots", "try.sh"), "#!/bin/sh\necho from robots\n");
    chmodSync(path.join(dir, "robots", "try.sh"), 0o755);
    assert.equal(findTryScript(dir), path.join("scripts", "try.sh"));
  });

  it("runs the one it found and says which it ran", async () => {
    const dir = worktree("#!/bin/sh\necho from scripts\n", "scripts");
    const result = await runTryScript(dir);
    assert.equal(result.ran, true);
    assert.equal(result.script, path.join("scripts", "try.sh"));
    assert.match(result.stdout, /from scripts/);
  });

  it("names both when a branch has neither, so the reason is actionable", async () => {
    const dir = worktree();
    const result = await runTryScript(dir);
    assert.equal(result.ran, false);
    for (const candidate of TRY_SCRIPTS) {
      assert.ok(String(result.reason).includes(candidate), `reason should name ${candidate}`);
    }
  });
});
