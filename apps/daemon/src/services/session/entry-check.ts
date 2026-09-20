import { execFile } from "child_process";
import os from "os";
import path from "path";
import type { EntryCheck, WorkflowTemplate } from "../../types/template.types.js";
import { getTemplateForProject } from "../../stores/template.store.js";

/**
 * Phase entry checks.
 *
 * A template may name, per phase, a command the daemon runs before a ticket
 * enters that phase. Exit zero lets the move through; any other exit, a
 * timeout, or a command that cannot be started refuses it, and the ticket does
 * not move. The check is keyed by phase name at the template's top level, not
 * on the phase, so it also covers the phases the daemon injects (Ideas, Done),
 * which no template defines.
 *
 * The daemon learns nothing about what the command checks. It passes the
 * ticket, project, and the two phases in the environment, and reports the
 * command's last output lines as the reason.
 */

export const DEFAULT_ENTRY_CHECK_TIMEOUT_SECONDS = 60;
const MAX_REASON_LINES = 5;

export interface EntryCheckContext {
  projectId: string;
  projectPath: string | undefined;
  ticketId: string;
  fromPhase: string;
  toPhase: string;
  /** Who is causing this move: "hand:<user>", "auto", or "hook:<name>". The check is
   * told rather than left to guess, because an estate writing its own account of a card
   * cannot tell a human's decision from the machine's from inside the command. */
  actor?: string;
}

export interface EntryCheckResult {
  allowed: boolean;
  reason: string;
}

export function findEntryCheck(
  template: Pick<WorkflowTemplate, "entryChecks"> | null | undefined,
  phase: string,
): EntryCheck | null {
  const check = template?.entryChecks?.[phase];
  return check ?? null;
}

export function validateEntryChecks(entryChecks: unknown): string | null {
  if (entryChecks === undefined) return null;
  if (entryChecks === null || typeof entryChecks !== "object" || Array.isArray(entryChecks)) {
    return "entryChecks must be an object keyed by phase name";
  }
  for (const [phase, check] of Object.entries(entryChecks as Record<string, unknown>)) {
    const c = check as Partial<EntryCheck> | null;
    if (!c || !Array.isArray(c.command) || c.command.length === 0 ||
        !c.command.every((part) => typeof part === "string" && part.length > 0)) {
      return `entryChecks.${phase}.command must be a non-empty array of non-empty strings`;
    }
    if (c.timeoutSeconds !== undefined &&
        (typeof c.timeoutSeconds !== "number" || !(c.timeoutSeconds > 0))) {
      return `entryChecks.${phase}.timeoutSeconds must be a positive number`;
    }
  }
  return null;
}

function expandHome(p: string): string {
  return p === "~" || p.startsWith("~/") ? path.join(os.homedir(), p.slice(1)) : p;
}

function lastLines(text: string): string {
  return text.trim().split(/\r?\n/).filter((l) => l.trim()).slice(-MAX_REASON_LINES).join("\n");
}

/**
 * Run one entry check. The command is executed directly, never through a
 * shell, so nothing in a ticket or template is interpreted as shell syntax.
 */
export function runEntryCheck(check: EntryCheck, ctx: EntryCheckContext): Promise<EntryCheckResult> {
  const [program, ...args] = check.command.map(expandHome);
  const timeoutMs = (check.timeoutSeconds ?? DEFAULT_ENTRY_CHECK_TIMEOUT_SECONDS) * 1000;
  return new Promise((resolve) => {
    execFile(
      program,
      args,
      {
        cwd: ctx.projectPath,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024,
        env: {
          ...process.env,
          POTATO_PROJECT_ID: ctx.projectId,
          POTATO_TICKET_ID: ctx.ticketId,
          POTATO_FROM_PHASE: ctx.fromPhase,
          POTATO_TO_PHASE: ctx.toPhase,
          POTATO_ACTOR: ctx.actor ?? "",
        },
      },
      (error, stdout, stderr) => {
        const output = lastLines(`${stdout ?? ""}\n${stderr ?? ""}`);
        if (!error) {
          resolve({ allowed: true, reason: output });
          return;
        }
        const e = error as NodeJS.ErrnoException & { killed?: boolean; signal?: string | null; code?: number | string };
        let why: string;
        if (e.killed || e.signal === "SIGTERM") {
          why = `entry check timed out after ${timeoutMs / 1000}s`;
        } else if (typeof e.code === "string") {
          why = `entry check could not run (${e.code}): ${program}`;
        } else {
          why = `entry check exited ${e.code ?? "nonzero"}`;
        }
        resolve({ allowed: false, reason: output ? `${why}\n${output}` : why });
      },
    );
  });
}

/**
 * Decide a move. Returns null when the target phase has no entry check.
 * The WIP override's force is deliberately not an input: force exceeds a
 * limit, it does not skip a check.
 */
export async function checkPhaseEntry(
  ctx: EntryCheckContext,
  loadTemplate: (projectId: string) => Promise<Pick<WorkflowTemplate, "entryChecks"> | null> = getTemplateForProject,
  run: (check: EntryCheck, ctx: EntryCheckContext) => Promise<EntryCheckResult> = runEntryCheck,
): Promise<EntryCheckResult | null> {
  const check = findEntryCheck(await loadTemplate(ctx.projectId), ctx.toPhase);
  if (!check) return null;
  // A configured check fails closed: with no project path to run it in, the move is refused.
  if (!ctx.projectPath) {
    return { allowed: false, reason: `entry check could not run: project ${ctx.projectId} has no known path` };
  }
  return run(check, ctx);
}
