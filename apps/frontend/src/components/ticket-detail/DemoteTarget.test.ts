import { describe, it, expect } from 'vitest'
import { demoteTargetFor } from './TicketDetailPanel'

// Bang's own board, which is the one this was written against.
const BANG = ['Ideas', 'Spec', 'Build', 'Gate', 'Align', 'Done']

describe('where Demote sends a card', () => {
  it('sends a card in the review column back to Build, not to the Gate', () => {
    // Stepping back one from Align lands on Gate, which re-runs the same check on the
    // same code and reaches the same answer. A person pressing Demote has looked at
    // what was built and wants it different.
    expect(demoteTargetFor(BANG, 'Align')).toBe('Build')
  })

  it('sends a card in the Gate back to Build too', () => {
    expect(demoteTargetFor(BANG, 'Gate')).toBe('Build')
  })

  it('sends a card in Done back to Build', () => {
    expect(demoteTargetFor(BANG, 'Done')).toBe('Build')
  })

  it('steps back one before there is a build to go back to', () => {
    // Spec has no build behind it, so one step back is the only meaning Demote has.
    expect(demoteTargetFor(BANG, 'Spec')).toBe('Ideas')
  })

  it('sends a card in Build back one, not to itself', () => {
    expect(demoteTargetFor(BANG, 'Build')).toBe('Spec')
  })

  it('has nowhere to send the first column, and says so with null', () => {
    expect(demoteTargetFor(BANG, 'Ideas')).toBeNull()
  })

  it('answers null for a phase the board does not have', () => {
    expect(demoteTargetFor(BANG, 'Nowhere')).toBeNull()
    expect(demoteTargetFor(BANG, undefined)).toBeNull()
    expect(demoteTargetFor([], 'Align')).toBeNull()
  })

  it('finds the build column whatever the board calls its columns', () => {
    // The rule is the build column, not the fourth column. A board with different
    // names around it still sends work back to the place work is done.
    const other = ['Inbox', 'Design', 'build', 'Checks', 'Review', 'Shipped']
    expect(demoteTargetFor(other, 'Review')).toBe('build')
    expect(demoteTargetFor(other, 'Design')).toBe('Inbox')
  })

  it('steps back one on a board with no build column at all', () => {
    const noBuild = ['Ideas', 'Doing', 'Review', 'Done']
    expect(demoteTargetFor(noBuild, 'Review')).toBe('Doing')
  })
})
