import { describe, it, expect } from 'vitest'
import { parseCardIds } from './ThreadTab'

describe('the card lens: a card names its own ids', () => {
  it('reads the ids line a real card carries', () => {
    // BAN-1's own description, as the daemon stores it.
    const description =
      'ids: US-LEND-10, FR-LEND-10, AC-LEND-10, AC-LEND-20, NFR-PRIV-10, AC-PRIV-20, AC-PRIV-10'
    expect(parseCardIds(description)).toEqual([
      'US-LEND-10',
      'FR-LEND-10',
      'AC-LEND-10',
      'AC-LEND-20',
      'NFR-PRIV-10',
      'AC-PRIV-20',
      'AC-PRIV-10',
    ])
  })

  it('finds the line wherever it sits in the description', () => {
    const description = [
      'Lend and return in the browser.',
      '',
      'ids: US-UI-10, FR-UI-10',
      '',
      'Read design/README.md first.',
    ].join('\n')
    expect(parseCardIds(description)).toEqual(['US-UI-10', 'FR-UI-10'])
  })

  it('takes the first ids line only, so a card cannot quietly carry two lenses', () => {
    const description = 'ids: US-UI-10\nids: NFR-PRIV-10'
    expect(parseCardIds(description)).toEqual(['US-UI-10'])
  })

  it('tolerates the spacing and casing a person actually types', () => {
    expect(parseCardIds('  IDs:US-UI-10 ,  FR-UI-10 ,')).toEqual(['US-UI-10', 'FR-UI-10'])
  })

  it('gives no ids for a card that never named any', () => {
    // Not an error: a card with no ids line is a card nobody has decided the
    // promises for yet, and the tab shows the whole manifest.
    expect(parseCardIds('Just a card, no ids here.')).toEqual([])
    expect(parseCardIds('')).toEqual([])
    expect(parseCardIds(undefined)).toEqual([])
  })

  it('does not mistake prose that merely mentions ids for the line', () => {
    // The line has to start with it. Prose about the ids line is not one.
    expect(parseCardIds('The ids: line is missing on purpose.')).toEqual([])
  })
})
