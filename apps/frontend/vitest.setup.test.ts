import { describe, it, expect } from 'vitest'
import { webStorageRefusal } from './vitest.setup'

/**
 * The refusal is the whole point of the file, so it is the thing under test.
 *
 * It is checked against a made-up version rather than the one this process happens to
 * be on, because a test that only passes on the broken Node can only be written by
 * somebody already standing there, and by then they have spent the hour this file
 * exists to save.
 */
describe('the Node the suite needs', () => {
  it('says nothing when localStorage is there, whatever the Node', () => {
    expect(webStorageRefusal('v26.5.1', true)).toBeNull()
    expect(webStorageRefusal('v22.23.2', true)).toBeNull()
  })

  it('names the Node it is on, so the reader does not have to go and look', () => {
    const refusal = webStorageRefusal('v26.5.1', false)
    expect(refusal).toContain('This suite needs Node 22, and this is Node v26.5.1.')
  })

  it('gives the cause, not the symptom', () => {
    const refusal = webStorageRefusal('v26.5.1', false) ?? ''
    // The symptom is what the reader would otherwise chase: a zustand stack trace
    // naming a dependency nobody changed.
    expect(refusal).toContain("Cannot read properties of undefined (reading 'setItem')")
    expect(refusal).toContain('--localstorage-file')
    expect(refusal).toContain('vitest skips any jsdom key the global already has')
  })

  it('rules out the wrong answer by name', () => {
    // An opaque origin is the first thing anybody checks, and it is not this. Saying
    // so costs one line and saves the reader the experiment.
    expect(webStorageRefusal('v26.5.1', false)).toContain('It is not an opaque origin.')
  })

  it('says what to do, with a command that can be pasted', () => {
    const refusal = webStorageRefusal('v26.5.1', false) ?? ''
    expect(refusal).toContain('.nvmrc')
    expect(refusal).toMatch(/nvm use|node@22\/bin/)
  })

  it('refuses on any Node whose localStorage is missing, not on a version it knows', () => {
    // The check is on the fact, so a Node 30 that fixes this passes without an edit
    // here, and a Node 24 that does not is caught without being listed.
    expect(webStorageRefusal('v24.0.0', false)).not.toBeNull()
    expect(webStorageRefusal('v30.0.0', true)).toBeNull()
  })
})
