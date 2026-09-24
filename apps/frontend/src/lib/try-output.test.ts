import { describe, it, expect } from 'vitest'
import { findOpenableUrl } from './try-output'

/**
 * The link a try script printed.
 *
 * try.sh starts the card's web app on a free loopback port and prints the link. The
 * panel showed it inside a block of monospaced transcript, so a reader had to find it,
 * select it without catching the surrounding text, and paste it.
 */
describe('the link in a try transcript', () => {
  it('finds the link try.sh prints, in the shape it prints it', () => {
    const transcript = [
      'Starting the web app from this branch on a free loopback port.',
      'It reads a temporary records file seeded with invented things.',
      '',
      '    http://127.0.0.1:52341/return/1',
      '',
      'It is answering. The link is live for 30 minutes.',
    ].join('\n')
    expect(findOpenableUrl(transcript)).toBe('http://127.0.0.1:52341/return/1')
  })

  it('takes the route the card is about over a front page printed first', () => {
    const transcript = 'http://127.0.0.1:52341/\nOpening http://127.0.0.1:52341/lend'
    expect(findOpenableUrl(transcript)).toBe('http://127.0.0.1:52341/lend')
  })

  it('offers nothing for a command transcript, which is most cards', () => {
    const transcript = [
      'No screen. Try it runs this and shows the transcript:',
      '$ lend list',
      '  Ladder\tSam\t2026-01-05',
      'Exited 0.',
    ].join('\n')
    expect(findOpenableUrl(transcript)).toBeNull()
    expect(findOpenableUrl('')).toBeNull()
    expect(findOpenableUrl(null)).toBeNull()
  })

  it('offers only this machine', () => {
    // The transcript is output from a script, and a link in it is a link the panel is
    // about to open. Anything that is not loopback is not something this button offers.
    expect(findOpenableUrl('see http://example.com/thing')).toBeNull()
    expect(findOpenableUrl('http://192.168.1.10:8080/')).toBeNull()
    expect(findOpenableUrl('http://evil.com/?x=http://127.0.0.1:1/')).toBe('http://127.0.0.1:1/')
  })

  it('takes localhost and the IPv6 loopback too', () => {
    expect(findOpenableUrl('http://localhost:5173/board')).toBe('http://localhost:5173/board')
    expect(findOpenableUrl('http://[::1]:3131/health')).toBe('http://[::1]:3131/health')
  })

  it('leaves the sentence punctuation out of the link', () => {
    expect(findOpenableUrl('Open http://127.0.0.1:52341/lend.')).toBe('http://127.0.0.1:52341/lend')
    expect(findOpenableUrl('(http://127.0.0.1:52341/lend)')).toBe('http://127.0.0.1:52341/lend')
  })
})
