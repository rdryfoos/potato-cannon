import { strict as assert } from "node:assert";
import { after, describe, it } from "node:test";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { resolveStartPoint } from "../worktree.js";

/**
 * Where a card's branch starts from.
 *
 * The version before this one always asked for `origin/master`, and asked origin even
 * when the project had no remote. A project with no remote and a `main` default branch
 * could satisfy neither half of that ref, so every card's worktree failed to be created.
 * The first test here is that project.
 */

const made: string[] = [];

function repo(setup: (dir: string) => void): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "worktree-start-"));
  made.push(dir);
  const run = (cmd: string) => execSync(cmd, { cwd: dir, stdio: "pipe" });
  run("git init -q");
  run("git config user.email t@t");
  run("git config user.name t");
  run("git commit -q --allow-empty -m first");
  setup(dir);
  return dir;
}

after(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

describe("resolveStartPoint", () => {
  it("uses the local default branch when the project has no remote", () => {
    const dir = repo((d) => execSync("git branch -M main", { cwd: d, stdio: "pipe" }));
    assert.equal(resolveStartPoint(dir), "main");
  });

  it("uses master locally when that is the default branch", () => {
    const dir = repo((d) => execSync("git branch -M master", { cwd: d, stdio: "pipe" }));
    assert.equal(resolveStartPoint(dir), "master");
  });

  it("never returns an origin ref when no remote is configured", () => {
    const dir = repo((d) => execSync("git branch -M main", { cwd: d, stdio: "pipe" }));
    assert.ok(!resolveStartPoint(dir).startsWith("origin/"));
  });

  it("prefers the remote's default branch when origin is configured", () => {
    const origin = repo((d) => execSync("git branch -M main", { cwd: d, stdio: "pipe" }));
    const dir = repo((d) => {
      const run = (cmd: string) => execSync(cmd, { cwd: d, stdio: "pipe" });
      run("git branch -M main");
      run(`git remote add origin "${origin}"`);
      run("git fetch origin -q");
    });
    assert.equal(resolveStartPoint(dir), "origin/main");
  });

  it("falls back to the local branch when origin is configured but unreachable", () => {
    const dir = repo((d) => {
      const run = (cmd: string) => execSync(cmd, { cwd: d, stdio: "pipe" });
      run("git branch -M main");
      run('git remote add origin "/nonexistent/repo.git"');
    });
    assert.equal(resolveStartPoint(dir), "main");
  });
});
