import { execFile } from "child_process";
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
 * see the software run without leaving the board. This runs one file, `robots/try.sh`,
 * from inside the card's own worktree, and returns stdout, stderr and the exit code.
 *
 * What the caller may choose: which card. That is all.
 *
 * Nothing else is a parameter. The command is not supplied, not appended to, and not
 * interpreted by a shell: the daemon executes a fixed path inside a directory it
 * computed itself. There is no way to express "run something else" in a request, which
 * is the property that makes a button like this safe to put on a page. The estate
 * governs what `robots/try.sh` does; the daemon governs that nothing else runs.
 */

/** How long a try may take before it is killed and reported as a timeout. */
export const TRY_TIMEOUT_SECONDS = 120;
const MAX_OUTPUT_BYTES = 256 * 1024;
const TRY_SCRIPT = path.join("robots", "try.sh");

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
): Promise<TryResult> {
  const script = path.join(worktree, TRY_SCRIPT);
  const base: TryResult = { ran: false, exitCode: null, stdout: "", stderr: "", script: TRY_SCRIPT };

  if (!existsSync(script)) {
    return Promise.resolve({
      ...base,
      reason: `This card's branch has no ${TRY_SCRIPT}, so there is nothing to run.`,
    });
  }

  return new Promise((resolve) => {
    run(
      script,
      [],
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
