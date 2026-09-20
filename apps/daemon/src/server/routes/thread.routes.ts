import type { Express, Request, Response } from "express";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { Project } from "../../types/config.types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The Thread tab: Loupe, reading a card's branch, served entirely from here.
 *
 * Loupe is a static viewer with two fixed expectations, and the whole shape of
 * this file follows from them:
 *
 *   1. It fetches its artifact from whatever `?manifest=<url>` names.
 *   2. Source peek is a GET to the absolute path `/api/source`, carrying the
 *      manifest's own `repoPath` back as a query parameter -- and it only
 *      fires at all when the manifest came from the viewer's own origin.
 *
 * So the daemon serves the bundle, the manifest, and the source, and all three
 * are the same origin. Nothing here reaches the network.
 *
 * The `repoPath` round trip is the part worth reading twice. The manifest on
 * disk carries whatever absolute path the emitter happened to run in -- often
 * some other machine's directory, and in every case a real path on somebody's
 * disk. That value is neither trusted nor forwarded: the manifest is rewritten
 * on the way out so `repoPath` is an opaque card token, and `/api/source`
 * resolves the token back to that card's worktree. A request can therefore
 * only ever name a card, never a directory, and the worktree it resolves to is
 * chosen here rather than supplied by the caller. Containment is then a second
 * check on top of that, not the only one.
 */

const MANIFEST_CANDIDATES = ["trace-manifest.json", "out/trace-manifest.json"];

const TOKEN_PREFIX = "potato:";

/** The opaque stand-in for a worktree path, handed to the viewer and taken back. */
export function cardToken(projectId: string, ticketId: string): string {
  return `${TOKEN_PREFIX}${encodeURIComponent(projectId)}/${encodeURIComponent(ticketId)}`;
}

/**
 * Read a card token back. Returns null for anything that is not one -- notably
 * for a real filesystem path, which is what an unrewritten manifest or a
 * hand-made request would carry.
 */
export function parseCardToken(
  token: string | undefined | null,
): { projectId: string; ticketId: string } | null {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  const rest = token.slice(TOKEN_PREFIX.length);
  const slash = rest.indexOf("/");
  if (slash <= 0 || slash === rest.length - 1) return null;
  try {
    const projectId = decodeURIComponent(rest.slice(0, slash));
    const ticketId = decodeURIComponent(rest.slice(slash + 1));
    if (!projectId || !ticketId) return null;
    if (ticketId.includes("/")) return null;
    return { projectId, ticketId };
  } catch {
    return null;
  }
}

/** Where a card's branch is checked out. Mirrors ensureWorktree in session/worktree.ts. */
export function worktreePathFor(projectPath: string, ticketId: string): string {
  return path.join(projectPath, ".potato", "worktrees", ticketId);
}

/**
 * Resolve a viewer-supplied relative path inside a worktree, or null if it
 * would land anywhere else. Absolute paths and any amount of `..` are refused
 * rather than clamped: a path that escapes is a bug or an attack, and neither
 * deserves a best guess.
 */
export function resolveInWorktree(worktree: string, relPath: string): string | null {
  if (!relPath) return null;
  const root = path.resolve(worktree);
  const target = path.resolve(root, relPath);
  const rel = path.relative(root, target);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return target;
}

/** The first manifest the worktree actually has, or null. */
async function findManifest(worktree: string): Promise<string | null> {
  for (const candidate of MANIFEST_CANDIDATES) {
    const full = path.join(worktree, candidate);
    try {
      const stat = await fs.stat(full);
      if (stat.isFile()) return full;
    } catch {
      // not there; try the next one
    }
  }
  return null;
}

const CONTEXT_LINES = 8;

export function registerThreadRoutes(app: Express, getProjects: () => Map<string, Project>): void {
  // The vendored Loupe bundle. Built from the loupe repo with --base=/loupe/,
  // so its own asset URLs already point here. See public/loupe/PROVENANCE.md.
  app.use("/loupe", express.static(path.join(__dirname, "..", "..", "..", "public", "loupe")));

  // The card's manifest, with repoPath rewritten to this card's token.
  app.get(
    "/api/tickets/:project/:id/trace-manifest.json",
    async (req: Request, res: Response) => {
      try {
        const projectId = decodeURIComponent(req.params.project);
        const ticketId = req.params.id;

        const project = getProjects().get(projectId);
        if (!project) {
          res.status(404).json({ error: `Unknown project: ${projectId}` });
          return;
        }

        const worktree = worktreePathFor(project.path, ticketId);
        const manifestPath = await findManifest(worktree);
        if (!manifestPath) {
          res.status(404).json({
            error: "no-manifest",
            message:
              `No trace-manifest.json in this card's branch worktree. ` +
              `Looked for ${MANIFEST_CANDIDATES.join(" and ")} under ${path.join(".potato", "worktrees", ticketId)}.`,
          });
          return;
        }

        const raw = await fs.readFile(manifestPath, "utf-8");
        let manifest: Record<string, unknown>;
        try {
          manifest = JSON.parse(raw) as Record<string, unknown>;
        } catch (parseError) {
          res.status(422).json({
            error: "bad-manifest",
            message: `${path.relative(worktree, manifestPath)} is not valid JSON: ${(parseError as Error).message}`,
          });
          return;
        }

        manifest.repoPath = cardToken(projectId, ticketId);
        res.setHeader("Cache-Control", "no-store");
        res.json(manifest);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  // Loupe's source peek. The path is fixed by the viewer, so it is mounted at
  // the root of /api rather than under the card -- the card comes in as the
  // token that replaced repoPath.
  app.get("/api/source", async (req: Request, res: Response) => {
    try {
      const card = parseCardToken(req.query.repoPath as string | undefined);
      const relPath = req.query.path as string | undefined;
      if (!card || !relPath) {
        res.status(400).json({ error: "repoPath (a card token) and path are required" });
        return;
      }

      const project = getProjects().get(card.projectId);
      if (!project) {
        res.status(404).json({ error: `Unknown project: ${card.projectId}` });
        return;
      }

      const worktree = worktreePathFor(project.path, card.ticketId);
      const target = resolveInWorktree(worktree, relPath);
      if (!target) {
        res.status(403).json({ error: "path escapes the card's worktree" });
        return;
      }

      let contents: string;
      try {
        contents = await fs.readFile(target, "utf-8");
      } catch {
        res.status(404).json({ error: `File not found in this card's branch: ${relPath}` });
        return;
      }

      const line = Number(req.query.line ?? "1") || 1;
      const allLines = contents.split("\n");
      const start = Math.max(1, line - CONTEXT_LINES);
      const end = Math.min(allLines.length, line + CONTEXT_LINES);
      const lines = [];
      for (let n = start; n <= end; n++) {
        lines.push({ n, text: allLines[n - 1] ?? "", isTarget: n === line });
      }

      res.setHeader("Cache-Control", "no-store");
      res.json({
        path: relPath,
        totalLines: allLines.length,
        startLine: start,
        endLine: end,
        targetLine: line,
        lines,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}
