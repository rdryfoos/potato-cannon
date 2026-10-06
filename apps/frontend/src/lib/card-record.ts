/**
 * A card's story, and a card's record.
 *
 * A description is two things in one field. The top of it is the record: `ids:`,
 * `branch:`, `head:`, `reviewed:` and whatever else a worker or a hook has written as a
 * named line. Under that is the story, which is what a person wrote and the only part
 * most readers want.
 *
 * Details showed them in the order they happen to be stored, so the first thing anybody
 * saw on opening a card was four lines of SHAs. The story is first now and the record
 * folds under it.
 *
 * What counts as a record line is the same shape the daemon's `setLine` writes and
 * finds: a name, a colon, a space. A story that opens "Note: ..." would be read as a
 * record line, which is a real cost and the same one the daemon already carries; the
 * alternative is a fixed list of names that goes stale the first time a hook writes a
 * new one.
 */
export interface CardLine {
  name: string
  value: string
}

export interface StoryAndRecord {
  /** What a person wrote, with the record lines taken out. */
  story: string
  /** The named lines, in the order the card carries them. */
  record: CardLine[]
}

const LINE = /^([A-Za-z][A-Za-z0-9_-]*):[ \t]+(.*)$/

export function splitStoryAndRecord(description?: string | null): StoryAndRecord {
  const record: CardLine[] = []
  const story: string[] = []
  for (const raw of String(description ?? '').split('\n')) {
    const match = LINE.exec(raw.trim())
    if (match) {
      record.push({ name: match[1], value: match[2].trim() })
    } else {
      story.push(raw)
    }
  }
  // Leading and trailing blank lines are an artefact of taking lines out of the middle.
  return { story: story.join('\n').replace(/^\s*\n+/, '').replace(/\n+\s*$/, ''), record }
}
