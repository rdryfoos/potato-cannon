import { describe, it, expect } from 'vitest'
import { cardOutline } from './card-outline'

const at = (n: number) => `2026-09-24T0${n}:00:00.000Z`

/**
 * What a card's outline says about how it got where it is.
 *
 * The board told a reader where every card was and nothing about how it arrived. On
 * 2026-09-24 a card sat in Gate with its work finished and green, refused, and the
 * board said only "Gate".
 */
describe('the outline on a card', () => {
  it('shows a card in Done as promoted', () => {
    expect(cardOutline({ phase: 'Done', history: [{ phase: 'Done', at: at(1) }] } as never)).toBe('promoted')
  })

  it('shows a refused card as refused, wherever it is', () => {
    // The refusal happened in the review column, which is where the card still is.
    const ticket = {
      phase: 'Gate',
      history: [
        { phase: 'Gate', at: at(1) },
        { phase: 'Align', at: at(2), endedAt: at(2), refused: true, reason: 'no such branch' },
      ],
    }
    expect(cardOutline(ticket as never)).toBe('refused')
  })

  it('stops showing refused once the card actually moves', () => {
    // A refusal that has since been followed by a real move is history. A refusal that
    // is the last word is the state.
    const ticket = {
      phase: 'Align',
      history: [
        { phase: 'Gate', at: at(1) },
        { phase: 'Align', at: at(2), endedAt: at(2), refused: true, reason: 'no such branch' },
        { phase: 'Align', at: at(3) },
      ],
    }
    expect(cardOutline(ticket as never)).toBeNull()
  })

  it('shows refused over promoted when the last word was a refusal', () => {
    // A card in Done that somebody then failed to move somewhere else. What happened
    // most recently is what the outline is about.
    const ticket = {
      phase: 'Done',
      history: [
        { phase: 'Done', at: at(1) },
        { phase: 'Build', at: at(2), endedAt: at(2), refused: true, reason: 'at its limit' },
      ],
    }
    expect(cardOutline(ticket as never)).toBe('refused')
  })

  it('outlines nothing on a card in the ordinary middle of its life', () => {
    expect(cardOutline({ phase: 'Build', history: [{ phase: 'Build', at: at(1) }] } as never)).toBeNull()
    expect(cardOutline({ phase: 'Ideas', history: [] } as never)).toBeNull()
  })

  it('answers for a card with no history at all', () => {
    // Every card had one before it had two.
    expect(cardOutline({ phase: 'Done' } as never)).toBe('promoted')
    expect(cardOutline({ phase: 'Ideas' } as never)).toBeNull()
  })
})
