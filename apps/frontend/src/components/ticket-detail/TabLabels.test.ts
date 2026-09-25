import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const panel = readFileSync(join(__dirname, 'TicketDetailPanel.tsx'), 'utf8')

/** The card panel's tab row: every trigger, in the order it is drawn. */
function tabRow(): { value: string; label: string }[] {
  const list = panel.slice(panel.indexOf('<TabsList'))
  const row = list.slice(0, list.indexOf('</TabsList>'))
  return [...row.matchAll(/<TabsTrigger value="([^"]+)"[^>]*>([^<]+)<\/TabsTrigger>/g)]
    .map((m) => ({ value: m[1]!, label: m[2]!.trim() }))
}

describe("the card panel's tab row", () => {
  it('reads Agents, Details, Thread, Admin', () => {
    expect(tabRow().map((t) => t.label)).toEqual(['Agents', 'Details', 'Thread', 'Admin'])
  })

  it('keeps the ids the labels sit on, because only the label was renamed', () => {
    // `value` is the tab's id: what `activeTab` holds, what each TabsContent matches
    // on. A rename of the label that quietly renamed the id would break any stored or
    // linked tab and would be a different change from the one that was asked for.
    expect(tabRow().map((t) => t.value)).toEqual(['activity', 'details', 'thread', 'settings'])
  })

  it('has a TabsContent for every trigger, matched on the id and not the label', () => {
    for (const { value } of tabRow()) {
      expect(panel, `no TabsContent for ${value}`).toContain(`<TabsContent value="${value}"`)
    }
  })

  it('no longer shows the two old labels anywhere in this panel', () => {
    // Agents was asked for in an earlier batch and never carried; this is what stops
    // it being asked for a third time.
    expect(panel).not.toMatch(/<TabsTrigger[^>]*>Activity</)
    expect(panel).not.toMatch(/<TabsTrigger[^>]*>Settings</)
  })
})
