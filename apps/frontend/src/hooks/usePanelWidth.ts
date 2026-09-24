import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * How wide the card panel is, and remembering it.
 *
 * The panel was 480 pixels and nothing else. A card's description, its Thread tab and
 * its Activity feed all live in it, and on a wide screen there is room for twice that
 * while the board still shows its columns. A reader who wanted to read a spec in the
 * panel had to open it somewhere else.
 *
 * The width is kept in this browser's own storage rather than on the card or the
 * project: it is a fact about the person's screen, not about the work. Storage can
 * throw or come back empty, in a private window or with site data cleared, so every
 * read and write is guarded and the panel opens at its default rather than not at all.
 */
export const PANEL_WIDTH_KEY = 'potato-cannon.panel-width'
export const DEFAULT_PANEL_WIDTH = 480
export const MIN_PANEL_WIDTH = 360

/** The widest the panel may be: the board must still be a board behind it. */
export function maxPanelWidth(viewportWidth: number): number {
  return Math.max(MIN_PANEL_WIDTH, Math.round(viewportWidth * 0.8))
}

export function clampPanelWidth(width: number, viewportWidth: number): number {
  if (!Number.isFinite(width)) return DEFAULT_PANEL_WIDTH
  return Math.min(Math.max(Math.round(width), MIN_PANEL_WIDTH), maxPanelWidth(viewportWidth))
}

export function readStoredWidth(viewportWidth: number): number {
  try {
    const raw = window.localStorage.getItem(PANEL_WIDTH_KEY)
    if (!raw) return DEFAULT_PANEL_WIDTH
    return clampPanelWidth(Number(raw), viewportWidth)
  } catch {
    return DEFAULT_PANEL_WIDTH
  }
}

export function storeWidth(width: number): void {
  try {
    window.localStorage.setItem(PANEL_WIDTH_KEY, String(width))
  } catch {
    // A private window, or site data blocked. The panel still works; it just opens at
    // its default next time, which is better than refusing to open.
  }
}

export function usePanelWidth() {
  const [width, setWidth] = useState(DEFAULT_PANEL_WIDTH)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startWidth = useRef(DEFAULT_PANEL_WIDTH)

  useEffect(() => {
    setWidth(readStoredWidth(window.innerWidth))
  }, [])

  const onPointerDown = useCallback((event: { clientX: number }) => {
    startX.current = event.clientX
    startWidth.current = width
    setDragging(true)
  }, [width])

  useEffect(() => {
    if (!dragging) return
    // The panel is on the right, so dragging its left edge leftwards widens it.
    const move = (event: PointerEvent) => {
      setWidth(clampPanelWidth(startWidth.current + (startX.current - event.clientX), window.innerWidth))
    }
    const up = () => {
      setDragging(false)
      setWidth((current) => {
        storeWidth(current)
        return current
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [dragging])

  return { width, dragging, onPointerDown }
}
