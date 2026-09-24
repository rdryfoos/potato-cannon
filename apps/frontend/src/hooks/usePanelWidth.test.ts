import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  clampPanelWidth,
  DEFAULT_PANEL_WIDTH,
  maxPanelWidth,
  MIN_PANEL_WIDTH,
  PANEL_WIDTH_KEY,
  readStoredWidth,
  storeWidth,
} from './usePanelWidth'

/**
 * How wide the card panel is, and remembering it.
 *
 * It was 480 pixels and nothing else. A card's description, its Thread tab and its
 * Activity feed all live in it, and on a wide screen there is room for twice that while
 * the board still shows its columns.
 */
describe('the panel width', () => {
  beforeEach(() => {
    try { window.localStorage.clear() } catch { /* private window */ }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens at its default when nothing has been remembered', () => {
    expect(readStoredWidth(1600)).toBe(DEFAULT_PANEL_WIDTH)
  })

  it('remembers a width across a reload', () => {
    storeWidth(760)
    expect(readStoredWidth(1600)).toBe(760)
  })

  it('will not go narrower than a card is readable in', () => {
    expect(clampPanelWidth(50, 1600)).toBe(MIN_PANEL_WIDTH)
  })

  it('leaves the board a board behind it', () => {
    // A panel that can take the whole window is a panel that can hide the thing it
    // belongs to. Eighty per cent, and never less than the minimum.
    expect(maxPanelWidth(1600)).toBe(1280)
    expect(clampPanelWidth(5000, 1600)).toBe(1280)
    expect(maxPanelWidth(300)).toBe(MIN_PANEL_WIDTH)
  })

  it('clamps a remembered width to the screen it is opened on', () => {
    // A width set on a large monitor must not take the whole window on a laptop.
    storeWidth(1400)
    expect(readStoredWidth(1000)).toBe(800)
  })

  it('ignores a stored value that is not a width', () => {
    window.localStorage.setItem(PANEL_WIDTH_KEY, 'not a number')
    expect(readStoredWidth(1600)).toBe(DEFAULT_PANEL_WIDTH)
  })

  it('opens at its default rather than not at all when storage throws', () => {
    // A private window, or site data blocked. Every read and write is guarded because
    // a panel that will not open is worse than one that forgets its width.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(readStoredWidth(1600)).toBe(DEFAULT_PANEL_WIDTH)

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => storeWidth(700)).not.toThrow()
  })
})
