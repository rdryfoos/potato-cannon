import { describe, it, expect } from 'vitest'
import { phaseRole, roleOf } from './phase-role.js'

/**
 * What a column is for, rather than what it is called.
 *
 * Buttons and checks decided by column name: `phase === 'Review' || phase === 'Align'`,
 * repeated wherever somebody needed to know whether a card was under review. Every
 * project that renamed a column had to be added to every one of those lists, and a
 * project nobody had thought of lost the button.
 */
describe('what a column is for', () => {
  it('believes a template that says what a column is for', () => {
    // The point of the rename. A project can call its review column anything.
    expect(phaseRole({ name: 'Align', role: 'review' })).toBe('review')
    expect(phaseRole({ name: 'Second Opinion', role: 'review' })).toBe('review')
  })

  it('reads a template that says nothing by its names, as before', () => {
    expect(phaseRole({ name: 'Review' })).toBe('review')
    expect(phaseRole({ name: 'Build' })).toBe('build')
    expect(phaseRole({ name: 'Done' })).toBe('done')
  })

  it('keeps Align working, which is the rule for the rename', () => {
    // A board that still says Align, with no role declared anywhere, must not lose a
    // button because somebody renamed a column in a template it does not use.
    expect(phaseRole('Align')).toBe('review')
    expect(roleOf('Align', [])).toBe('review')
    expect(roleOf('Align', null)).toBe('review')
  })

  it('lets the template overrule the name, not the other way round', () => {
    // A column called Build that the template says is the review column is the review
    // column. The declaration is the authority; the names are the fallback.
    expect(roleOf('Build', [{ name: 'Build', role: 'review' }])).toBe('review')
  })

  it('falls back to the name when the template names a different column', () => {
    expect(roleOf('Gate', [{ name: 'Align', role: 'review' }])).toBe('gate')
  })

  it('ignores a role it does not know rather than inventing one', () => {
    expect(phaseRole({ name: 'Review', role: 'whatever' })).toBe('review')
    expect(phaseRole({ name: 'Nowhere', role: 'whatever' })).toBeNull()
  })

  it('answers null for a column it cannot place', () => {
    expect(phaseRole('Second Opinion')).toBeNull()
    expect(phaseRole(null)).toBeNull()
    expect(roleOf('', [])).toBeNull()
    expect(roleOf(undefined)).toBeNull()
  })

  it('does not care about case or surrounding space', () => {
    expect(phaseRole('  DONE  ')).toBe('done')
    expect(roleOf('  align ', [{ name: 'Align' }])).toBe('review')
  })
})
