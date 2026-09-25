import { execSync } from "child_process";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";


function git(projectPath: string, command: string): string {
  return execSync(command, { cwd: projectPath, encoding: "utf-8", stdio: "pipe" }).trim();
}

function refExists(projectPath: string, ref: string): boolean {
  try {
    git(projectPath, `git rev-parse --verify --quiet ${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Where a card's branch starts from: the project's own default branch, on this machine.
 *
 * This used to prefer `origin/<default>` whenever an `origin` existed, on the reasoning
 * that a card should start from what the host has rather than from whatever the local
 * checkout happens to be sitting on. That reasoning has a hole, and on 2026-09-25 a
 * cold run fell into it.
 *
 * A project whose promotions are local merges never pushes. Its `origin` is frozen at
 * the moment it was cloned and is stale from the first commit afterwards. The Bang
 * install commits twice, at steps 5 and 6, so by the time a reader drags their first
 * card the local branch is two commits ahead of a remote nothing will ever update.
 * Every card was cut from the commit before the install, so every worktree was missing
 * `.specify/` and the checker inside it: a Spec worker refused, correctly, and the
 * card could not move. The card's base was a commit the project had already left.
 *
 * So: the local default branch, which is the branch this project's promotions merge
 * into and the one it was registered on. `origin/<default>` only when there is no local
 * branch of that name, which is a bare or freshly-cloned checkout that has not checked
 * anything out yet.
 *
 * Considered and not taken: cutting from whichever of the two is not behind the other.
 * It is cleverer and it gets both cases right, but two branches can diverge, and then
 * the rule needs a tiebreak that no reader of a card could predict. A board is a
 * governance tool; a base a person cannot predict is worse than one that is sometimes
 * behind, and a person who wants the host's newer work pulls it.
 *
 * `git fetch origin` goes with it. It ran on every card creation, and for a project
 * that never pushes it was a network call to a remote whose answer was then unused:
 * Bang's BANG.md lists what it fetches from the network, and this was not on the list.
 * It now runs only when origin is actually going to be the base.
 */
export function resolveStartPoint(projectPath: string): string {
  for (const branch of ["main", "master"]) {
    if (refExists(projectPath, branch)) return branch;
  }

  let remotes: string[] = [];
  try {
    remotes = git(projectPath, "git remote").split("\n").map((r) => r.trim()).filter(Boolean);
  } catch {
    remotes = [];
  }

  if (remotes.includes("origin")) {
    try {
      git(projectPath, "git fetch origin");
    } catch (fetchError) {
      console.warn(`[worktree] git fetch origin failed: ${(fetchError as Error).message}`);
    }
    try {
      const head = git(projectPath, "git symbolic-ref refs/remotes/origin/HEAD")
        .replace("refs/remotes/origin/", "");
      if (head && refExists(projectPath, `origin/${head}`)) return `origin/${head}`;
    } catch {
      // origin has no HEAD ref; fall through to the named guesses
    }
    for (const branch of ["main", "master"]) {
      if (refExists(projectPath, `origin/${branch}`)) return `origin/${branch}`;
    }
    console.warn("[worktree] origin is configured but has no usable default branch; using HEAD");
  }

  return "HEAD";
}

/**
 * Ensure a git worktree exists for a ticket.
 * Creates the worktree if it doesn't exist, or returns the path if it does.
 */
export async function ensureWorktree(
  projectPath: string,
  ticketId: string,
  branchPrefix?: string,
): Promise<string> {
  const worktreesDir = path.join(projectPath, ".potato", "worktrees");
  const worktreePath = path.join(worktreesDir, ticketId);
  const branchName = `${branchPrefix || 'potato'}/${ticketId}`;

  // Check if worktree already exists and is valid
  if (existsSync(path.join(worktreePath, ".git"))) {
    console.log(`Worktree already exists at ${worktreePath}`);
    return worktreePath;
  }

  // Clean up if directory exists but isn't a valid worktree
  if (existsSync(worktreePath)) {
    await fs.rm(worktreePath, { recursive: true, force: true });
  }

  // Ensure worktrees directory exists
  await fs.mkdir(worktreesDir, { recursive: true });

  try {
    const startPoint = resolveStartPoint(projectPath);

    console.log(
      `Creating worktree for ticket ${ticketId} from ${startPoint}...`,
    );

    // Check if branch already exists
    let branchExists = false;
    try {
      execSync(`git rev-parse --verify ${branchName}`, {
        cwd: projectPath,
        encoding: "utf-8",
        stdio: "pipe",
      });
      branchExists = true;
    } catch {
      branchExists = false;
    }

    if (branchExists) {
      execSync(`git worktree add "${worktreePath}" ${branchName}`, {
        cwd: projectPath,
        encoding: "utf-8",
      });
    } else {
      execSync(
        `git worktree add -b ${branchName} "${worktreePath}" ${startPoint}`,
        {
          cwd: projectPath,
          encoding: "utf-8",
        },
      );
    }

    console.log(`Worktree created at ${worktreePath}`);

    // .claude/ is commonly gitignored (local agent config, skills, etc.),
    // so `git worktree add` never brings it along even though it's exactly
    // what a Claude Code session running inside the worktree needs to find
    // project-level skills. Copy it over explicitly - best-effort, since a
    // missing/failed copy shouldn't block the worktree from being usable.
    const sourceClaudeDir = path.join(projectPath, ".claude");
    const worktreeClaudeDir = path.join(worktreePath, ".claude");
    if (existsSync(sourceClaudeDir) && !existsSync(worktreeClaudeDir)) {
      try {
        await fs.cp(sourceClaudeDir, worktreeClaudeDir, { recursive: true });
        console.log(`Copied .claude/ into worktree at ${worktreeClaudeDir}`);
      } catch (copyError) {
        console.warn(`[worktree] Failed to copy .claude/ into worktree: ${(copyError as Error).message}`);
      }
    }

    return worktreePath;
  } catch (error) {
    // No silent fallback to the project's own checkout. A phase that declares
    // requiresWorktree gets a worktree or gets nothing: falling back puts an agent in
    // the primary checkout, on the default branch, where a commit lands on main with
    // no branch, no review and no promotion. In the run that found this, the only
    // thing that kept main clean was an agent noticing where it was and refusing to
    // work, which is judgment rather than a guard.
    const message = `Failed to create worktree for ${ticketId} at ${worktreePath}: ${(error as Error).message}`;
    console.error(message);
    throw new Error(message);
  }
}

/**
 * Remove git worktree and rename the branch for preservation during restart.
 * Renames branch to potato-resets/{ticketId}-{timestamp} to preserve commits.
 * Used during phase restart to clean up but preserve git work.
 */
export async function removeWorktreeAndRenameBranch(
  projectPath: string,
  ticketId: string
): Promise<{ worktreeRemoved: boolean; branchRenamed: boolean; newBranchName: string | null; errors: string[] }> {
  const errors: string[] = [];
  let worktreeRemoved = false;
  let branchRenamed = false;
  let newBranchName: string | null = null;

  const worktreePath = path.join(projectPath, ".potato", "worktrees", ticketId);
  const branchName = `potato/${ticketId}`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const resetBranchName = `potato-resets/${ticketId}-${timestamp}`;

  // Remove worktree first (must be done before branch rename)
  if (existsSync(worktreePath)) {
    try {
      execSync(`git worktree remove "${worktreePath}" --force`, {
        cwd: projectPath,
        encoding: "utf-8",
        stdio: "pipe",
      });
      worktreeRemoved = true;
    } catch (error) {
      errors.push(`Failed to remove worktree: ${(error as Error).message}`);
    }
  }

  // Rename branch to preserve commits (only if worktree was removed or didn't exist)
  if (worktreeRemoved || !existsSync(worktreePath)) {
    try {
      // Check if branch exists
      execSync(`git rev-parse --verify "${branchName}"`, {
        cwd: projectPath,
        encoding: "utf-8",
        stdio: "pipe",
      });

      // Rename the branch
      execSync(`git branch -m "${branchName}" "${resetBranchName}"`, {
        cwd: projectPath,
        encoding: "utf-8",
        stdio: "pipe",
      });
      branchRenamed = true;
      newBranchName = resetBranchName;
      console.log(`[worktree] Renamed branch ${branchName} to ${resetBranchName}`);
    } catch (error) {
      const errorMsg = (error as Error).message;
      // Branch may not exist - only log if it was a real error
      if (!errorMsg.includes("not found") && !errorMsg.includes("fatal: Needed a single revision")) {
        errors.push(`Failed to rename branch: ${errorMsg}`);
      }
    }
  }

  return { worktreeRemoved, branchRenamed, newBranchName, errors };
}

/**
 * Remove git worktree and local branch for a ticket.
 * Used during archive to clean up git artifacts.
 * Handles errors gracefully - archive should proceed even if cleanup fails.
 */
export async function removeWorktreeAndBranch(
  projectPath: string,
  ticketId: string
): Promise<{ worktreeRemoved: boolean; branchRemoved: boolean; errors: string[] }> {
  const errors: string[] = [];
  let worktreeRemoved = false;
  let branchRemoved = false;

  const worktreePath = path.join(projectPath, ".potato", "worktrees", ticketId);
  const branchName = `potato/${ticketId}`;

  // Remove worktree first (must be done before branch deletion)
  if (existsSync(worktreePath)) {
    try {
      execSync(`git worktree remove "${worktreePath}" --force`, {
        cwd: projectPath,
        encoding: "utf-8",
        stdio: "pipe",
      });
      worktreeRemoved = true;
    } catch (error) {
      errors.push(`Failed to remove worktree: ${(error as Error).message}`);
    }
  }

  // Remove local branch
  try {
    execSync(`git branch -D "${branchName}"`, {
      cwd: projectPath,
      encoding: "utf-8",
      stdio: "pipe",
    });
    branchRemoved = true;
  } catch (error) {
    // Branch may not exist - only log if it was a real error
    const errorMsg = (error as Error).message;
    if (!errorMsg.includes("not found") && !errorMsg.includes("error: branch")) {
      errors.push(`Failed to remove branch: ${errorMsg}`);
    }
  }

  return { worktreeRemoved, branchRemoved, errors };
}
