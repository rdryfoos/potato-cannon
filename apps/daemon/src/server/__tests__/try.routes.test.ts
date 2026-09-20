import { strict as assert } from "node:assert";
import { after, describe, it } from "node:test";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runTryScript, TRY_TIMEOUT_SECONDS } from "../routes/try.routes.js";

/**
 * Try it runs one file and no other.
 *
 * The property worth testing is not that a script runs, which is easy, but that
 * nothing a caller sends can change what runs. The route takes a card id and computes
 * the worktree itself; this covers the half below that, where a worktree is handed in
 * and exactly `robots/try.sh` inside it is executed, with no arguments and no shell.
 */

const made: string[] = [];

function worktree(script?: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "try-route-"));
  made.push(dir);
  if (script !== undefined) {
    mkdirSync(path.join(dir, "robots"), { recursive: true });
    const file = path.join(dir, "robots", "try.sh");
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
