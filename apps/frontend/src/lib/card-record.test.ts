import { describe, it, expect } from 'vitest'
import { splitStoryAndRecord } from './card-record'

/**
 * Details showed a card's description in the order it is stored, so the first thing
 * anybody saw on opening a card was four lines of SHAs. The story is what a person
 * wrote; the record is what a worker or a hook put there.
 */
const CARD = [
  'ids: US-UI-10, FR-UI-10',
  'branch: potato/BAN-1',
  'head: 760cbdf1c6c0e2d1a0f0c4b7a5d8e9f0a1b2c3d4',
  'reviewed: 206e2cc9a7b3c1d0e4f5a6b7c8d9e0f1a2b3c4d5',
  '',
  'The story a person wrote, which is the part most readers want.',
  '',
  'A second paragraph.',
].join('\n')

describe('splitStoryAndRecord', () => {
  it('takes the named lines out and keeps their order', () => {
    const { record } = splitStoryAndRecord(CARD)
    expect(record.map((l) => l.name)).toEqual(['ids', 'branch', 'head', 'reviewed'])
    expect(record[0].value).toBe('US-UI-10, FR-UI-10')
    expect(record[3].value).toBe('206e2cc9a7b3c1d0e4f5a6b7c8d9e0f1a2b3c4d5')
  })

  it('leaves the story whole, without the blank lines the lines left behind', () => {
    const { story } = splitStoryAndRecord(CARD)
    expect(story).toBe(
      'The story a person wrote, which is the part most readers want.\n\nA second paragraph.')
  })

  it('handles a card that is all record and no story', () => {
    const { story, record } = splitStoryAndRecord('ids: AC-UI-10\nbranch: potato/BAN-2')
    expect(story).toBe('')
    expect(record).toHaveLength(2)
  })

  it('handles a card that is all story and no record', () => {
    const { story, record } = splitStoryAndRecord('Just a sentence somebody wrote.')
    expect(story).toBe('Just a sentence somebody wrote.')
    expect(record).toEqual([])
  })

  it('handles an empty description', () => {
    expect(splitStoryAndRecord(undefined)).toEqual({ story: '', record: [] })
    expect(splitStoryAndRecord('')).toEqual({ story: '', record: [] })
  })

  it('keeps a block in the story, because a Rework block is something a hand wrote', () => {
    const withBlock = 'ids: AC-UI-10\n\n<!-- rework:begin -->\nUse the item name.\n<!-- rework:end -->'
    const { story, record } = splitStoryAndRecord(withBlock)
    expect(record.map((l) => l.name)).toEqual(['ids'])
    expect(story).toContain('rework:begin')
    expect(story).toContain('Use the item name.')
  })

  it('reads a line the daemon would write later, without being told its name', () => {
    // queued-worker: arrived after this file was written. A fixed list of names would
    // have put it in the story.
    const { record } = splitStoryAndRecord('queued-worker: Build, waiting for the session')
    expect(record).toEqual([{ name: 'queued-worker', value: 'Build, waiting for the session' }])
  })

  it('reads a prose line that opens like a record line as a record line', () => {
    // The known cost, stated: this is the same shape the daemon's setLine finds, and a
    // fixed list of names is the alternative that goes stale.
    const { record } = splitStoryAndRecord('Note: this is prose and it lands in the record.')
    expect(record.map((l) => l.name)).toEqual(['Note'])
  })
})
