// src/services/card-ids.ts
//
// The ids a card claims, and whether the registry has them.
//
// A card is created with an `ids:` line naming the promises it carries. Nothing checked
// them. A typo, a renamed ID, or an ID from another project's registry made a card that
// looked exactly like a real one, and the first thing to notice was the Gate, several
// columns and one worker's run later, when the card could not be proven.
//
// So the create path asks the project's own registry. The check is deliberately
// grammar-blind: it does not know what an ID looks like, only that the registry names
// it. SpecAssay's `id_regex` is per project and this has no business carrying a second
// copy of it.
import fs from "fs";
import path from "path";

/** Where SpecAssay keeps the setting that names the registry. */
const SPECASSAY_CONFIG = path.join(
  ".specify", "extensions", "specassay-check", "specassay-check-config.yml");

/** The word a card uses to say it carries no promise, as `**Carries**: none` does. */
export const NO_IDS = "none";

/** The ids on a card's `ids:` line, in order, or [] when it has no such line. */
export function parseIdsLine(description?: string | null): string[] {
  for (const raw of String(description ?? "").split("\n")) {
    const line = raw.trim();
    if (!/^ids:/i.test(line)) continue;
    return line
      .slice(line.indexOf(":") + 1)
      .split(/[\s,;]+/)
      .map((t) => t.trim().replace(/^[`*(\[]+|[`*).\],]+$/g, ""))
      .filter(Boolean)
      .filter((t) => t.toLowerCase() !== NO_IDS);
  }
  return [];
}

/**
 * The registry file for a project, or null when there is nothing to read.
 *
 * The path comes from SpecAssay's own config, the same place its checker reads it from,
 * so a project that keeps its registry somewhere other than PRD.md is still checked
 * rather than waved through.
 */
export function registryPathFor(projectPath: string): string | null {
  let named = "PRD.md";
  try {
    const config = fs.readFileSync(path.join(projectPath, SPECASSAY_CONFIG), "utf-8");
    const match = config.match(/^registry:\s*"?([^"#\n]+?)"?\s*$/m);
    if (match) named = match[1].trim();
  } catch {
    // No config: the default is what SpecAssay's own template ships with.
  }
  const full = path.join(projectPath, named);
  return fs.existsSync(full) ? full : null;
}

/**
 * The ids the registry does not name, out of the ones given.
 *
 * Whole-word, so `AC-UI-1` does not pass on the strength of `AC-UI-10`, and so a
 * registry that mentions an ID in prose counts: a line that names it is a line that
 * names it, and deciding which mentions are definitions is the Gate's job, not this
 * one's. This check exists to catch a typo at the moment it is typed.
 */
export function idsNotIn(registryText: string, ids: string[]): string[] {
  return ids.filter((id) => {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return !new RegExp(`(^|[^A-Za-z0-9_-])${escaped}([^A-Za-z0-9_-]|$)`).test(registryText);
  });
}

export interface IdCheck {
  /** False only when the registry was read and some id was not in it. */
  ok: boolean;
  /** The ids the registry did not name. */
  missing: string[];
  /** Why no check happened, when none did. */
  skipped?: string;
}

/**
 * Whether a card may be created with these ids.
 *
 * Three ways to pass, and only one way to fail. No `ids:` line, or `ids: none`, is a
 * card nobody has decided the promises for yet, which is allowed and ordinary. A
 * project with no registry on disk cannot be checked, and refusing a card because a
 * file is missing would stop a project before it has one. What fails is an id the
 * registry could have named and did not.
 */
export function checkCardIds(projectPath: string | undefined, description?: string | null): IdCheck {
  const ids = parseIdsLine(description);
  if (ids.length === 0) return { ok: true, missing: [], skipped: "the card names no ids" };
  if (!projectPath) return { ok: true, missing: [], skipped: "the project has no path on disk" };
  const registry = registryPathFor(projectPath);
  if (!registry) return { ok: true, missing: [], skipped: "this project has no registry file" };
  let text: string;
  try {
    text = fs.readFileSync(registry, "utf-8");
  } catch {
    return { ok: true, missing: [], skipped: `${registry} could not be read` };
  }
  const missing = idsNotIn(text, ids);
  return { ok: missing.length === 0, missing };
}
