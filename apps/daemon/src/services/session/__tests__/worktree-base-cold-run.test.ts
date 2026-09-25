import { strict as assert } from "node:assert";
import { after, describe, it } from "node:test";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { ensureWorktree, resolveStartPoint } from "../worktree.js";

/**
 * The seventh cold run, reproduced: a clone with an origin and two local commits ahead.
 *
 * ginger installed Bang cleanly, opened the board and dragged BAN-1 to Spec. The Spec
 * worker refused because its worktree had no `.specify/` and no checker, and it did not
 * copy them in, which is the rule and is right. The worktree was cut from `origin/main`,
 * frozen at the clone, two commits behind the branch the project had already moved on
 * to: the install commits at steps 5 and 6 were not in it.
 *
 * This is the shape of that project, built from scratch, driven through the same
 * function the daemon calls, asserting the one fact the run needed and did not get: the
 * card's worktree stands on what the project has now.
 */
const made: string[] = [];

after(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

/** A clone with an origin, then the two commits BANG.md's steps 5 and 6 make. */
function installedProject(): { project: string; origin: string } {
  const origin = mkdtempSync(path.join(os.tmpdir(), "cold-run-origin-"));
  const project = mkdtempSync(path.join(os.tmpdir(), "cold-run-project-"));
  made.push(origin, project);

  const run = (cmd: string, cwd: string) => execSync(cmd, { cwd, stdio: "pipe" });
  run("git init -q", origin);
  run("git config user.email t@t", origin);
  run("git config user.name t", origin);
  writeFileSync(path.join(origin, "BANG.md"), "# BANG.md\n");
  run("git add -A", origin);
  run('git commit -q -m "the shipped repository"', origin);
  run("git branch -M main", origin);

  rmSync(project, { recursive: true, force: true });
  execSync(`git clone -q "${origin}" "${project}"`, { stdio: "pipe" });
  run("git config user.email t@t", project);
  run("git config user.name t", project);

  // Step 5: specify init, then commit.
  execSync("mkdir -p .specify/memory", { cwd: project });
  writeFileSync(path.join(project, ".specify", "memory", "constitution.md"), "# Constitution\n");
  run("git add -A", project);
  run('git commit -q -m "Bang: Spec Kit initialised"', project);

  // Step 6: SpecAssay, then commit. This is the checker a Spec worker looks for.
  execSync("mkdir -p .specify/extensions/specassay-check/scripts", { cwd: project });
  writeFileSync(
    path.join(project, ".specify", "extensions", "specassay-check", "scripts", "check-traceability.sh"),
    "#!/bin/sh\nexit 0\n",
  );
  run("git add -A", project);
  run('git commit -q -m "Bang: SpecAssay installed"', project);

  return { project, origin };
}

const sha = (ref: string, cwd: string) =>
  execSync(`git rev-parse ${ref}`, { cwd, encoding: "utf-8" }).trim();

describe("a card dragged on a freshly installed project", () => {
  it("stands on what the project has now, not on the frozen remote", async () => {
    const { project } = installedProject();

    assert.notEqual(
      sha("main", project),
      sha("origin/main", project),
      "the fixture must be two commits ahead, as a real install is",
    );

    const worktree = await ensureWorktree(project, "BAN-1");

    assert.equal(sha("HEAD", worktree), sha("main", project));
    assert.notEqual(sha("HEAD", worktree), sha("origin/main", project));
  });

  it("carries the checker the Spec worker refused without", async () => {
    // The refusal was right, and this is what it was refusing about. Both commits are
    // in the worktree now, so there is nothing to refuse and nothing to copy in.
    const { project } = installedProject();
    const worktree = await ensureWorktree(project, "BAN-2");

    assert.ok(
      existsSync(path.join(worktree, ".specify", "extensions", "specassay-check", "scripts", "check-traceability.sh")),
      "the worktree should carry the checker",
    );
    assert.ok(
      existsSync(path.join(worktree, ".specify", "memory", "constitution.md")),
      "and the constitution step 5 committed",
    );
  });

  it("names the local branch as the base, which is the whole of the fix", async () => {
    const { project } = installedProject();
    assert.equal(resolveStartPoint(project), "main");
  });

  it("puts the card's branch on the card's own name", async () => {
    const { project } = installedProject();
    const worktree = await ensureWorktree(project, "BAN-3");
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: worktree,
      encoding: "utf-8",
    }).trim();
    assert.equal(branch, "potato/BAN-3");
  });
});
