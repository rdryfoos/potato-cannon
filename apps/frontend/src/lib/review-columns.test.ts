import { describe, it, expect } from 'vitest'
import { isAskableColumn } from './review-columns'

/**
 * Where Try it and Buddy are offered.
 *
 * They were offered in the review column only. That is where a person first asks
 * whether the thing works, but it is not the last place they ask: a card in Done is a
 * card somebody comes back to, and a reader opening one had neither the button nor the
 * agent, on the one card whose answer was finished.
 */
describe('the columns where somebody asks whether the thing works', () => {
  it('offers them in the review column, under both its names', () => {
    // Review in the stock template, Align in a project that renamed it.
    expect(isAskableColumn('Review')).toBe(true)
    expect(isAskableColumn('Align')).toBe(true)
  })

  it('offers them in Done, which is the change', () => {
    expect(isAskableColumn('Done')).toBe(true)
  })

  it('does not offer them while the work is still being done', () => {
    // A card in Build has nothing finished to try, and a question about it goes to the
    // worker through the composer's To: control instead.
    expect(isAskableColumn('Ideas')).toBe(false)
    expect(isAskableColumn('Spec')).toBe(false)
    expect(isAskableColumn('Build')).toBe(false)
    expect(isAskableColumn('Gate')).toBe(false)
  })

  it('matches on the name whatever its case or spacing', () => {
    // A board that still says Align keeps working, which is the rule for the rename.
    expect(isAskableColumn('  align  ')).toBe(true)
    expect(isAskableColumn('DONE')).toBe(true)
  })

  it('answers false rather than throwing for a card with no phase', () => {
    expect(isAskableColumn(undefined)).toBe(false)
    expect(isAskableColumn(null)).toBe(false)
    expect(isAskableColumn('')).toBe(false)
  })
})
