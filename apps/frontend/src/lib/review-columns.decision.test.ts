import { describe, it, expect } from 'vitest'
import { isAskableColumn, isDecisionColumn } from './review-columns'

/**
 * Promote and Demote were on every card in every column, which reads as an invitation
 * to drag a card forward out of Spec or back out of Build. Those are the Cannon's moves
 * to make. Review is the one column where a person has looked at what was built.
 */
describe('isDecisionColumn', () => {
  it('is true for the review column, by name', () => {
    expect(isDecisionColumn('Review')).toBe(true)
  })

  it('is true for a board that still calls it Align', () => {
    expect(isDecisionColumn('Align')).toBe(true)
  })

  it('is true for a column that declares the role, whatever it is called', () => {
    expect(isDecisionColumn('Second Opinion', [{ name: 'Second Opinion', role: 'review' }]))
      .toBe(true)
  })

  it('is false everywhere else, including Done', () => {
    // Done is finished. Try it and Buddy are for reading a card afterwards, which is
    // why isAskableColumn takes Done and this does not.
    for (const phase of ['Ideas', 'Spec', 'Build', 'Gate', 'Done']) {
      expect(isDecisionColumn(phase)).toBe(false)
    }
    expect(isAskableColumn('Done')).toBe(true)
  })

  it('is false for nothing and for a column nobody has heard of', () => {
    expect(isDecisionColumn(null)).toBe(false)
    expect(isDecisionColumn(undefined)).toBe(false)
    expect(isDecisionColumn('Marzipan')).toBe(false)
  })
})
