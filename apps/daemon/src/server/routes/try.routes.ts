import { execFile } from "child_process";
import { scriptCommand } from "../../lib/windows-exec.js";
import type { Express, Request, Response } from "express";
import type { Project } from "../../types/config.types.js";
import { existsSync } from "fs";
import path from "path";
import { worktreePathFor } from "./thread.routes.js";

/**
 * Try it: run the estate's own try script in a card's worktree and hand back what it
 * said.
 *
 * A reviewer can read a card's diff, its Gate and its thread, and until now could not
 * see the software run without leaving the board. This runs one file, the project's own
 * try script,
 * from inside the card's own worktree, and returns stdout, stderr and the exit code.
 *
 * What the caller may choose: which card. That is all.
 *
 * Nothing else is a parameter. The command is not supplied, not appended to, and not
 * interpreted by a shell: the daemon executes a fixed path inside a directory it
 * computed itself. There is no way to express "run something else" in a request, which
 * is the property that makes a button like this safe to put on a page. The estate
 * governs what that script does; the daemon governs that nothing else runs.
 */

/** How long a try may take before it is killed and reported as a timeout. */
export const TRY_TIMEOUT_SECONDS = 120;
const MAX_OUTPUT_BYTES = 256 * 1024;
/**
 * Where the try script lives, most recently named first.
 *
 * It was `robots/try.sh` and nothing else. The project this button was built for
 * renamed that folder to `scripts/` on 2026-09-21, because "robot" is not a word its
 * readers were meant to meet, and Try it has been pointing at a path that project no
 * longer has ever since: the button answered "this card's branch has no robots/try.sh",
 * which is true and useless. Both are looked for, newest first, so a project that has
 * not renamed anything is untouched.
 */
export const TRY_SCRIPTS = [path.join("scripts", "try.sh"), path.join("robots", "try.sh")];

/** The first try script a worktree actually has, or null. */
export function findTryScript(worktree: string): string | null {
  for (const candidate of TRY_SCRIPTS) {
    if (existsSync(path.join(worktree, candidate))) return candidate;
  }
  return null;
}

export interface TryResult {
  ran: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  script: string;
  reason?: string;
}

export function runTryScript(
  worktree: string,
  run: typeof execFile = execFile,
  // A seam for the tests, for the same reason entry-check.ts has one.
  platform: string = process.platform,
): Promise<TryResult> {
  const found = findTryScript(worktree);
  if (!found) {
    return Promise.resolve({
      ran: false,
      exitCode: null,
      stdout: "",
      stderr: "",
      script: TRY_SCRIPTS[0],
      reason:
        `This card's branch has no ${TRY_SCRIPTS.join(" and no ")}, ` +
        `so there is nothing to run.`,
    });
  }
  const TRY_SCRIPT = found;
  const script = path.join(worktree, TRY_SCRIPT);
  // Same as the entry checks: on Windows bash runs the .sh, everywhere else the
  // shebang does and this is the script unchanged.
  const { program, args } = scriptCommand(script, [], platform);

  return new Promise((resolve) => {
    run(
      program,
      args,
      { cwd: worktree, timeout: TRY_TIMEOUT_SECONDS * 1000, maxBuffer: MAX_OUTPUT_BYTES },
      (error, stdout, stderr) => {
        const out = String(stdout ?? "");
        const err = String(stderr ?? "");
        if (!error) {
          resolve({ ran: true, exitCode: 0, stdout: out, stderr: err, script: TRY_SCRIPT });
          return;
        }
        const e = error as NodeJS.ErrnoException & { killed?: boolean; code?: number | string };
        if (e.killed) {
          resolve({
            ran: true, exitCode: null, stdout: out, stderr: err, script: TRY_SCRIPT,
            reason: `It ran longer than ${TRY_TIMEOUT_SECONDS} seconds and was stopped.`,
          });
          return;
        }
        if (typeof e.code === "string") {
          resolve({
            ran: false, exitCode: null, stdout: out, stderr: err, script: TRY_SCRIPT,
            reason: `${TRY_SCRIPT} could not be started (${e.code}).`,
          });
          return;
        }
        resolve({
          ran: true, exitCode: typeof e.code === "number" ? e.code : 1,
          stdout: out, stderr: err, script: TRY_SCRIPT,
        });
      },
    );
  });
}

export function registerTryRoutes(
  app: Express,
  getProjects: () => Map<string, Project>,
): void {
  // POST because it runs something. A GET that executes is a GET somebody's browser
  // will prefetch.
  app.post("/api/tickets/:project/:id/try", async (req: Request, res: Response) => {
    const projectId = decodeURIComponent(req.params.project);
    const ticketId = decodeURIComponent(req.params.id);

    if (ticketId.includes("/") || ticketId.includes("..")) {
      res.status(400).json({ error: "Not a card id" });
      return;
    }

    const project = getProjects().get(projectId);
    if (!project?.path) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const worktree = worktreePathFor(project.path, ticketId);
    if (!existsSync(worktree)) {
      res.status(404).json({
        error: "No worktree",
        reason: "This card has no worktree, so there is no branch to run anything from.",
      });
      return;
    }

    try {
      res.json(await runTryScript(worktree));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}
