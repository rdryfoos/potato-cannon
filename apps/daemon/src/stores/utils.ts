import type Database from "better-sqlite3";

/**
 * Get the project prefix from the database for identifier generation.
 * Takes the display_name (or slug fallback), strips non-alphanumeric chars,
 * takes first 3 chars, uppercases. Falls back to "TKT".
 */
/**
 * A prefix a caller gave, cleaned, or null if it is not usable as one.
 *
 * Letters and digits only, uppercased, up to eight, because a prefix is read aloud and
 * typed into a card's description by people. Everything else is dropped rather than
 * refused: a person typing "Bang (visual)" into the prefix box means BANGVISUAL, and
 * an id is not the place to be strict about punctuation.
 */
export function normaliseCardPrefix(value: string | null | undefined): string | null {
  const cleaned = (value ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
  return cleaned || null;
}

/**
 * The prefix a project's card ids carry.
 *
 * It used to be the first three alphanumerics of the display name, uppercased, with no
 * way to say otherwise. Two boards called "Bang (visual)" and "Bang (spare)" both
 * derived BAN, and because a card id is unique across the whole daemon rather than per
 * project, every card on both boards had to be created with its id passed by hand for
 * weeks, on pain of a collision.
 *
 * A project's own card_prefix wins when it has one. The derivation is unchanged for
 * every project that does not, so no existing board's ids move.
 */
export function getProjectPrefixFromDb(db: Database.Database, projectId: string): string {
  const row = db.prepare("SELECT display_name, slug, card_prefix FROM projects WHERE id = ?").get(projectId) as { display_name: string; slug: string; card_prefix: string | null } | undefined;
  const chosen = normaliseCardPrefix(row?.card_prefix);
  if (chosen) return chosen;
  const name = row?.display_name || row?.slug || "TKT";
  return (
    name
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 3)
      .toUpperCase() || "TKT"
  );
}
