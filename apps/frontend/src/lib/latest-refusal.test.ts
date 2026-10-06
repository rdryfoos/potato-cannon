import { describe, it, expect } from 'vitest'
import { latestRefusal } from './latest-refusal'

/**
 * A refused move is written to the card's history, and history is folded under the
 * record now. So the one thing a reader most needs on opening a refused card was two
 * controls away: the card sat where it was, and the reason was somewhere nobody looks.
 */
const moved = (phase: string, at: string) => ({ phase, at })
const refused = (phase: string, at: string, reason?: string, actor?: string) => ({
  phase, at, reason, actor, refused: true as const,
})

describe('latestRefusal', () => {
  it('finds a refusal that is the last thing that happened', () => {
    const r = latestRefusal([
      moved('Build', '2026-10-01T09:00:00.000Z'),
      refused('Done', '2026-10-02T09:00:00.000Z', 'the Gate has not run here', 'hand:rik'),
    ])
    expect(r).toEqual({
      phase: 'Done',
      reason: 'the Gate has not run here',
      actor: 'hand:rik',
      when: '2026-10-02T09:00:00.000Z',
    })
  })

  it('says nothing when the card moved after being refused', () => {
    // A refusal that has been answered is history rather than news, and a card showing
    // an old refusal above a move that succeeded is worse than showing nothing.
    expect(latestRefusal([
      refused('Done', '2026-10-01T09:00:00.000Z', 'not yet'),
      moved('Done', '2026-10-02T09:00:00.000Z'),
    ])).toBeNull()
  })

  it('says nothing for a card that has never been refused', () => {
    expect(latestRefusal([moved('Spec', '2026-10-01T09:00:00.000Z')])).toBeNull()
  })

  it('says nothing for a card with no history at all', () => {
    expect(latestRefusal([])).toBeNull()
    expect(latestRefusal(undefined)).toBeNull()
    expect(latestRefusal(null)).toBeNull()
  })

  it('carries a refusal that gave no reason', () => {
    // The entry check may refuse without saying why. The block still has to appear.
    const r = latestRefusal([refused('Gate', '2026-10-02T09:00:00.000Z')])
    expect(r?.phase).toBe('Gate')
    expect(r?.reason).toBeUndefined()
  })
})
