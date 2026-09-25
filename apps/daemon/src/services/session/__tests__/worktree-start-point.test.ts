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
 *
 * Then it preferred `origin/<default>` whenever an origin existed, which broke a
 * project whose promotions are local merges: its origin is frozen at the clone, so
 * every card was cut from the commit before the install. It now prefers the local
 * default branch and consults origin only when there is no local branch of that name.
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

  it("uses the local default branch even when origin is configured", () => {
    // Changed on 2026-09-25, and this is the change. It used to answer "origin/main".
    const origin = repo((d) => execSync("git branch -M main", { cwd: d, stdio: "pipe" }));
    const dir = repo((d) => {
      const run = (cmd: string) => execSync(cmd, { cwd: d, stdio: "pipe" });
      run("git branch -M main");
      run(`git remote add origin "${origin}"`);
      run("git fetch origin -q");
    });
    assert.equal(resolveStartPoint(dir), "main");
  });

  it("cuts from local main when it is ahead of a remote nothing will update", () => {
    // The seventh cold run, exactly. A project whose promotions are local merges never
    // pushes, so its origin is frozen at the clone. The Bang install commits twice, at
    // steps 5 and 6, and every card was then cut from the commit before the install:
    // no .specify/, no checker, a Spec worker that refused, and a card that could not
    // move. The base was a commit the project had already left.
    const origin = repo((d) => execSync("git branch -M main", { cwd: d, stdio: "pipe" }));
    const dir = repo((d) => {
      const run = (cmd: string) => execSync(cmd, { cwd: d, stdio: "pipe" });
      run("git branch -M main");
      run(`git remote add origin "${origin}"`);
      run("git fetch origin -q");
      run("git commit -q --allow-empty -m 'Bang: Spec Kit initialised'");
      run("git commit -q --allow-empty -m 'Bang: SpecAssay installed'");
    });

    const start = resolveStartPoint(dir);
    assert.equal(start, "main");

    const head = (ref: string) =>
      execSync(`git rev-parse ${ref}`, { cwd: dir, encoding: "utf-8" }).trim();
    assert.equal(head(start), head("main"), "a card starts from what the project has now");
    assert.notEqual(head(start), head("origin/main"), "and not from the frozen remote");
  });

  it("uses origin's default branch when there is no local branch of that name", () => {
    // A bare or freshly cloned checkout that has not checked anything out. This is the
    // only case origin is consulted for now, and the only case it is fetched for.
    const origin = repo((d) => execSync("git branch -M main", { cwd: d, stdio: "pipe" }));
    const dir = mkdtempSync(path.join(os.tmpdir(), "worktree-start-clone-"));
    made.push(dir);
    execSync(`git clone -q "${origin}" "${dir}"`, { stdio: "pipe" });
    execSync("git branch -M somewhere-else", { cwd: dir, stdio: "pipe" });

    assert.equal(resolveStartPoint(dir), "origin/main");
  });

  it("uses the local branch when origin is configured but unreachable", () => {
    const dir = repo((d) => {
      const run = (cmd: string) => execSync(cmd, { cwd: d, stdio: "pipe" });
      run("git branch -M main");
      run('git remote add origin "/nonexistent/repo.git"');
    });
    assert.equal(resolveStartPoint(dir), "main");
  });

  it("does not reach the network for a project that has a local default branch", () => {
    // It fetched origin on every card creation, and for a project that never pushes the
    // answer was then unused. Bang's BANG.md lists what it fetches from the network and
    // this was not on the list. An unreachable origin now costs nothing, because it is
    // never consulted: a fetch that was happening would take the timeout to fail.
    const dir = repo((d) => {
      const run = (cmd: string) => execSync(cmd, { cwd: d, stdio: "pipe" });
      run("git branch -M main");
      run('git remote add origin "https://192.0.2.1/unroutable.git"');
    });

    const started = Date.now();
    assert.equal(resolveStartPoint(dir), "main");
    assert.ok(Date.now() - started < 2000, "it should not have waited on a network call");
  });
});
