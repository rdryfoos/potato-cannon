import type { Ticket } from '@potato-cannon/shared'

/**
 * Cards in the order they were given their ids, oldest first.
 *
 * A column showed whatever order the daemon's list happened to arrive in, which is
 * insertion order in the store and is not the order a reader thinks in. Ideas is where
 * it bites: a reader creating BAN-1, BAN-2 and BAN-3 and being shown them in another
 * order has to read three titles to find the one the page told them to drag.
 *
 * An id is a prefix and a number. Sorting on the string puts BAN-10 above BAN-2, so
 * the number is compared as a number, and the prefix first so two boards' cards never
 * interleave. A card whose id does not have that shape sorts after the ones that do,
 * by id, rather than being dropped somewhere unpredictable.
 */
export function compareCardIds(a: string, b: string): number {
  const shape = /^(.*?)-(\d+)$/
  const left = shape.exec(a)
  const right = shape.exec(b)
  if (left && right) {
    if (left[1] !== right[1]) return left[1].localeCompare(right[1])
    return Number(left[2]) - Number(right[2])
  }
  if (left) return -1
  if (right) return 1
  return a.localeCompare(b)
}

export function byCardId<T extends { id: string }>(tickets: T[]): T[] {
  return [...tickets].sort((a, b) => compareCardIds(a.id, b.id))
}

export type CardSort = 'id' | 'recent'

/**
 * The order a column shows its cards in. `id` is the default and the only one a
 * reader has to understand.
 */
export function orderColumn(tickets: Ticket[], sort: CardSort = 'id'): Ticket[] {
  if (sort === 'recent') {
    return [...tickets].sort((a, b) => {
      const left = Date.parse(String(b.updatedAt ?? b.createdAt ?? '')) || 0
      const right = Date.parse(String(a.updatedAt ?? a.createdAt ?? '')) || 0
      return left - right
    })
  }
  return byCardId(tickets)
}
