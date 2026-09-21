// src/services/card-description.ts
//
// Targeted writes to a card's description.
//
// A card's description is a document several hands write into: a person types the
// story and the ids, a worker adds a `pr:` line, a robot keeps a status block, and
// now a reader's change request arrives as a Rework block. Every one of those
// writers has so far done the same thing - read the whole description, rebuild it,
// and write the whole thing back - which means every write is a chance to lose
// somebody else's. The estate's own robots/card-io.py says "targeted" in its
// comments for exactly this reason, and then does it in a shell.
//
// These are the primitives that make "targeted" true: each one changes the named
// block or the named line and returns the rest of the document byte for byte. They
// do no I/O, so they can be tested against the awkward cases rather than trusted.
//
// The block delimiters are the ones the estate already uses, so a block written
// here looks like the status block written there:
//
//   <!-- rework:begin -->
//   ...
//   <!-- rework:end -->

/** A block or line name: a slug, so nothing a caller passes can become markup. */
const NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

export function assertName(name: string): string {
  if (!NAME.test(name)) {
    throw new Error(
      `"${name}" is not a usable name: letters, digits, dash and underscore only, ` +
        `starting with a letter, at most 64 characters`,
    );
  }
  return name;
}

function delimiters(name: string): { begin: string; end: string; re: RegExp } {
  const begin = `<!-- ${name}:begin -->`;
  const end = `<!-- ${name}:end -->`;
  const escaped = name.replace(/[-]/g, "\\-");
  return {
    begin,
    end,
    // Greedy up to the matching end marker, and tolerant of the whitespace a
    // human editing the card by hand will leave behind.
    re: new RegExp(
      `\\n*<!--\\s*${escaped}:begin\\s*-->[\\s\\S]*?<!--\\s*${escaped}:end\\s*-->\\n*`,
      "g",
    ),
  };
}

export function getBlock(description: string, name: string): string | null {
  assertName(name);
  const { re } = delimiters(name);
  const found = (description || "").match(re);
  if (!found || found.length === 0) return null;
  const inner = found[0]
    .replace(/^\n*<!--\s*[A-Za-z0-9_-]+:begin\s*-->\n?/, "")
    .replace(/\n?<!--\s*[A-Za-z0-9_-]+:end\s*-->\n*$/, "");
  return inner;
}

/**
 * Set or replace one block, leaving everything else alone.
 *
 * `at` only decides where a block that does not exist yet goes. A block that is
 * already there is replaced where it stands: moving somebody's block because you
 * happened to pass a different `at` is not a targeted write.
 */
export function setBlock(
  description: string,
  name: string,
  text: string,
  at: "top" | "bottom" = "bottom",
): string {
  assertName(name);
  const { begin, end, re } = delimiters(name);
  const body = String(text ?? "").replace(/\s+$/, "");
  const rendered = `${begin}\n${body}\n${end}`;
  const doc = description || "";

  if (re.test(doc)) {
    re.lastIndex = 0;
    return doc.replace(re, `\n\n${rendered}\n\n`).replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  const rest = doc.trim();
  if (!rest) return rendered + "\n";
  return at === "top" ? `${rendered}\n\n${rest}\n` : `${rest}\n\n${rendered}\n`;
}

export function removeBlock(description: string, name: string): string {
  assertName(name);
  const { re } = delimiters(name);
  const doc = description || "";
  if (!re.test(doc)) return doc;
  re.lastIndex = 0;
  return doc.replace(re, "\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function lineRe(name: string): RegExp {
  const escaped = name.replace(/[-]/g, "\\-");
  return new RegExp(`^[ \\t]*${escaped}:[ \\t]*.*$`, "m");
}

export function getLine(description: string, name: string): string | null {
  assertName(name);
  const found = (description || "").match(lineRe(name));
  if (!found) return null;
  return found[0].slice(found[0].indexOf(":") + 1).trim();
}

/**
 * Set or replace one `name: value` line.
 *
 * A line that exists is rewritten in place, which is what keeps `ids:` above
 * `branch:` above `pr:` in the order a reader is used to. A line that does not goes
 * after the last existing line of that shape, or at the end of the prose if there
 * are none - never inside somebody's block.
 */
export function setLine(description: string, name: string, value: string): string {
  assertName(name);
  const doc = description || "";
  const rendered = `${name}: ${String(value ?? "").trim()}`;
  const re = lineRe(name);

  if (re.test(doc)) return doc.replace(re, rendered);

  // Find where the description's other key lines end, staying above any block.
  const lines = doc.split("\n");
  const firstBlock = lines.findIndex((l) => /^\s*<!--\s*[A-Za-z0-9_-]+:begin\s*-->/.test(l));
  const limit = firstBlock === -1 ? lines.length : firstBlock;
  let insertAt = 0;
  for (let i = 0; i < limit; i++) {
    if (/^[ \t]*[A-Za-z][A-Za-z0-9_-]*:[ \t]/.test(lines[i])) insertAt = i + 1;
  }
  if (insertAt === 0) insertAt = limit;

  lines.splice(insertAt, 0, rendered);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function removeLine(description: string, name: string): string {
  assertName(name);
  const doc = description || "";
  const re = lineRe(name);
  if (!re.test(doc)) return doc;
  return doc.replace(re, "").replace(/\n{3,}/g, "\n\n");
}

export interface DescriptionEdit {
  blocks?: Array<{ name: string; text?: string | null; at?: "top" | "bottom" }>;
  lines?: Array<{ name: string; value?: string | null }>;
}

/**
 * Apply a whole edit to a description, in one pass, and say what changed.
 *
 * Applying blocks and lines together in one call is not a convenience: it is how a
 * worker writes its `pr:` line and its status in one read-modify-write instead of
 * two, which halves the number of windows in which it can lose somebody else's
 * write. A null text or value removes that block or line.
 */
export function applyEdit(
  description: string,
  edit: DescriptionEdit,
): { description: string; changed: string[] } {
  let doc = description || "";
  const changed: string[] = [];

  for (const line of edit.lines || []) {
    const before = doc;
    doc = line.value === null || line.value === undefined
      ? removeLine(doc, line.name)
      : setLine(doc, line.name, line.value);
    if (doc !== before) changed.push(`line ${line.name}`);
  }

  for (const block of edit.blocks || []) {
    const before = doc;
    doc = block.text === null || block.text === undefined
      ? removeBlock(doc, block.name)
      : setBlock(doc, block.name, block.text, block.at || "bottom");
    if (doc !== before) changed.push(`block ${block.name}`);
  }

  return { description: doc, changed };
}
