import { describe, it, expect } from 'vitest'
import { absoluteTime } from './utils'

/**
 * `timeAgo` reads well and lies quietly: "13d ago" is computed once at render and never
 * again, so a board left open overnight says 13d of a card that is now 14 days old. The
 * relative form also cannot be compared between two cards, quoted, or matched against a
 * commit's date, which is what a card's age is wanted for.
 */
describe('absoluteTime', () => {
  it('gives a date and a time, not an interval', () => {
    const out = absoluteTime('2026-10-02T19:08:22.000Z')
    expect(out).not.toMatch(/ago|just now/)
    expect(out).toMatch(/2026/)
    expect(out).toMatch(/\d{1,2}:\d{2}/)
  })

  it('says the same thing however long the page has been open', () => {
    // The whole point: no Date.now() in it.
    const first = absoluteTime('2026-10-02T19:08:22.000Z')
    const second = absoluteTime('2026-10-02T19:08:22.000Z')
    expect(first).toBe(second)
  })

  it('orders two cards correctly, which a relative form cannot be relied on for', () => {
    const older = absoluteTime('2026-10-01T09:00:00.000Z')
    const newer = absoluteTime('2026-10-02T09:00:00.000Z')
    expect(older).not.toBe(newer)
  })

  it('gives nothing for nothing, rather than a date in 1970', () => {
    expect(absoluteTime(undefined)).toBe('')
    expect(absoluteTime('')).toBe('')
    expect(absoluteTime('not a date')).toBe('')
  })

  it('takes a Date as well as a string', () => {
    expect(absoluteTime(new Date('2026-10-02T19:08:22.000Z'))).toMatch(/2026/)
  })
})
