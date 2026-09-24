import { describe, it, expect } from 'vitest'
import { byCardId, compareCardIds, orderColumn } from './card-order'

/**
 * A column shows its cards oldest first, by id.
 *
 * The daemon's list arrives in insertion order, which is not an order a reader thinks
 * in. Ideas is where it bites: a reader told to drag the first card had to read three
 * titles to find out which one that was.
 */
describe('cards in id order', () => {
  it('puts the first card first', () => {
    const ids = byCardId([{ id: 'BAN-3' }, { id: 'BAN-1' }, { id: 'BAN-2' }]).map((t) => t.id)
    expect(ids).toEqual(['BAN-1', 'BAN-2', 'BAN-3'])
  })

  it('compares the number as a number, so BAN-10 comes after BAN-2', () => {
    // The reason this is not a string sort. A board reaches ten cards quickly and a
    // string sort quietly puts the tenth second, where nobody looks for it.
    const ids = byCardId([{ id: 'BAN-10' }, { id: 'BAN-2' }, { id: 'BAN-1' }]).map((t) => t.id)
    expect(ids).toEqual(['BAN-1', 'BAN-2', 'BAN-10'])
  })

  it('keeps two prefixes apart rather than interleaving them', () => {
    const ids = byCardId([
      { id: 'BANV-2' },
      { id: 'BAN-2' },
      { id: 'BANV-1' },
      { id: 'BAN-1' },
    ]).map((t) => t.id)
    expect(ids).toEqual(['BAN-1', 'BAN-2', 'BANV-1', 'BANV-2'])
  })

  it('sorts an id of another shape after the ones that fit, rather than anywhere', () => {
    const ids = byCardId([{ id: 'loose' }, { id: 'BAN-2' }, { id: 'BAN-1' }]).map((t) => t.id)
    expect(ids).toEqual(['BAN-1', 'BAN-2', 'loose'])
  })

  it('does not modify the array it was given', () => {
    const input = [{ id: 'BAN-3' }, { id: 'BAN-1' }]
    byCardId(input)
    expect(input.map((t) => t.id)).toEqual(['BAN-3', 'BAN-1'])
  })

  it('is a total order, so the sort is stable whatever it is handed', () => {
    expect(compareCardIds('BAN-1', 'BAN-1')).toBe(0)
    expect(compareCardIds('BAN-1', 'BAN-2')).toBeLessThan(0)
    expect(compareCardIds('BAN-2', 'BAN-1')).toBeGreaterThan(0)
  })

  it('defaults to id when a column is asked for an order', () => {
    const ids = orderColumn(
      [{ id: 'BAN-2' }, { id: 'BAN-1' }] as never,
    ).map((t) => t.id)
    expect(ids).toEqual(['BAN-1', 'BAN-2'])
  })

  it('can be asked for most-recent instead, newest first', () => {
    const ids = orderColumn(
      [
        { id: 'BAN-1', updatedAt: '2026-09-20T00:00:00Z' },
        { id: 'BAN-2', updatedAt: '2026-09-23T00:00:00Z' },
      ] as never,
      'recent',
    ).map((t) => t.id)
    expect(ids).toEqual(['BAN-2', 'BAN-1'])
  })
})
