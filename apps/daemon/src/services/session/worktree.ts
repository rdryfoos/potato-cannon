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
 * Where a card's branch starts from.
 *
 * A project with a remote branches from the remote's default branch, so a card starts
 * from what the host has rather than from whatever the local checkout happens to be
 * sitting on. A project without one branches from its own default branch at local HEAD.
 *
 * The earlier version always used `origin/master`, and consulted origin even when the
 * project had no remote at all. A project with no remote and a `main` default branch
 * could satisfy neither half of that ref, so worktree creation failed for every card,
 * every time.
 */
export function resolveStartPoint(projectPath: string): string {
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
    console.warn("[worktree] origin is configured but has no usable default branch; using the local one");
  }

  for (const branch of ["main", "master"]) {
    if (refExists(projectPath, branch)) return branch;
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
    console.error(`Failed to create worktree: ${(error as Error).message}`);
    return projectPath;
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
