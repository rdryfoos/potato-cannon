import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThreadTabProps {
  projectId: string
  ticketId: string
  /** The card's own words. Its `ids:` line, if it has one, is the card lens. */
  description?: string
  /** Shown in the rail header when the Descent view is up. */
  title?: string
}

/**
 * One view, after Rik's ruling on 2026-09-25 following the twelfth cold run.
 *
 * This tab offered Field and Descent under a sub-tab row. It shows one thing now:
 * Loupe's thread view with the rail, Intent over Build over Proof, for one of the
 * card's ids at a time. The Descent is out while it is reworked in Loupe, and the
 * Field is out because a reader who opened a card wanted this card, not the whole
 * strand field with this card's rows somewhere in it.
 *
 * `lens=list` is still what the frame is sent, because `list` is the lens Loupe rests
 * on and the rail is what an `?id=` opens on top of it. There is no lens called
 * thread: `main.ts` takes "list", "map" or "descent" and silently ignores anything
 * else, which is a thing this tab has already been caught doing once.
 */

/**
 * The id the descent opens on: the card's story, or its first id.
 *
 * Loupe rests closed without an `?id=`, on purpose: `main.ts` sets
 * `descentOpen = !!deepLinkId`, and its comment says an absent id "rests on the strand
 * field … never a single auto-picked landmark row". That is right for somebody holding
 * a URL and wrong for this tab, which is already looking at one card.
 *
 * The story, because a descent opened on a story is the whole card's strand and one
 * opened on a criterion is a twig of it. A card with no story id opens on the first id
 * it lists, which is the nearest thing it has to one.
 */
export function descentIdFor(cardIds: string[]): string | null {
  if (cardIds.length === 0) return null
  return cardIds.find((id) => id.startsWith('US-')) ?? cardIds[0]
}

/**
 * The ids a card carries, from its own `ids:` line.
 *
 * A card names the promises it is for on one line of its description. That
 * line is the whole of what makes this tab a lens on the manifest rather than
 * a second copy of it: the ids on it, and nothing hanging under them that the
 * card did not name. A card with no such line gets the whole manifest, which
 * is the honest answer to "which promises is this card for" when nobody has
 * said yet.
 */
export function parseCardIds(description?: string): string[] {
  if (!description) return []
  const line = description
    .split('\n')
    .find(l => /^\s*ids:/i.test(l))
  if (!line) return []
  return line
    .replace(/^\s*ids:/i, '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
}

/**
 * Loupe, framed, reading this card's branch.
 *
 * The viewer is a static bundle the daemon serves at /loupe, and it reads the
 * manifest the daemon serves for this card. Both come from the same origin,
 * which is not incidental: Loupe only offers source peek for an artifact from
 * its own origin, so pointing this frame anywhere else would silently turn the
 * feature off.
 *
 * `embed=1` is Loupe's own embed shell -- it drops the viewer's topbar, which
 * would otherwise repeat the card header sitting directly above this frame.
 *
 * The frame shows one of Loupe's views: the thread, with its rail of Intent over
 * Build over Proof, opened on one of the card's ids. This tab adds nothing to it
 * beyond narrowing the rows to the card's own ids and choosing which one is open.
 * No card node is drawn, because a card is a lens and not a level.
 */
/**
 * What this picture is of, in one line above the frame.
 *
 * The tab reads the worktree's manifest live off disk, so it shows whatever the last
 * Gate run in that worktree left behind. Without a date and a commit a reader cannot
 * tell this attempt's thread from the one before it, and on 2026-09-21 a report that
 * was eight hours stale and from another board read exactly like a current one.
 *
 * Either half can be missing and the line says which: a card with no commits yet has no
 * HEAD, and a manifest written by an older emitter has no generatedAt.
 */
export function asOfLine(generatedAt: string | null, head: string | null): string {
  const when = generatedAt
    ? `as of ${new Date(generatedAt).toLocaleString()}`
    : 'as of an unrecorded time'
  const where = head ? `worktree at ${head.slice(0, 7)}` : 'worktree commit unknown'
  return `${when}, ${where}`
}

export function ThreadTab({ projectId, ticketId, description, title }: ThreadTabProps) {
  // Which of the card's ids the rail is opened on. The card's story to begin with,
  // and whatever the reader picks after that.
  const [openId, setOpenId] = useState<string | null>(null)
  const manifestUrl = `/api/tickets/${encodeURIComponent(projectId)}/${encodeURIComponent(ticketId)}/trace-manifest.json`
  const cardIds = parseCardIds(description)

  // Asked before the frame is mounted so a card with no thread yet gets a
  // plain answer here, rather than Loupe's own "could not load" -- which is
  // written for someone holding a URL, and tells a reader of this pane to go
  // look in samples/.
  const { data: status, isLoading } = useQuery({
    queryKey: ['thread-manifest', projectId, ticketId],
    queryFn: async () => {
      const res = await fetch(manifestUrl)
      if (res.ok) {
        const body = await res.json().catch(() => null)
        return {
          present: true as const,
          generatedAt: typeof body?.generatedAt === 'string' ? body.generatedAt : null,
          head: typeof body?.worktreeHead === 'string' ? body.worktreeHead : null,
        }
      }
      const body = await res.json().catch(() => null)
      return {
        present: false as const,
        message: body?.message ?? `The daemon answered ${res.status} for this card's manifest.`,
      }
    },
  })

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    )
  }

  if (!status?.present) {
    return (
      <div className="h-full flex items-center justify-center px-8">
        <div className="max-w-md text-center">
          <GitBranch className="h-6 w-6 mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-primary mb-1">No thread on this branch yet</p>
          <p className="text-xs text-text-muted">{status?.message}</p>
        </div>
      </div>
    )
  }

  // The thread on show: the reader's pick, or the card's story until they pick.
  const shownId = openId ?? descentIdFor(cardIds)

  const params = new URLSearchParams({
    manifest: manifestUrl,
    embed: '1',
    lens: 'list',
    // Loupe's own flag, added for this tab. It hides "Back to field" and changes
    // nothing else. The field is not somewhere this tab can go, so an offer of it is
    // an offer of somewhere the reader was never coming from.
    field: '0',
  })
  if (cardIds.length > 0) params.set('ids', cardIds.join(','))
  // An `?id=` is what opens the rail: `main.ts` reads it before the lens
  // (`descentOpen = !!deepLinkId`) and draws that row's thread over the list. Without
  // one Loupe rests on the field, which is the thing this tab no longer shows.
  if (shownId) params.set('id', shownId)
  if (title) params.set('title', `${ticketId} ${title}`)

  return (
    <div className="h-full flex flex-col min-h-0">
      {/*
        The ids line was a count. It is the control now.

        A card carries a handful of promises and the rail shows one of them at a time,
        so the line that said how many there were is the obvious place to choose
        between them. Nothing is added above the frame that was not already there.
      */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2 shrink-0"
           data-testid="thread-id-picker">
        {cardIds.length > 0 ? (
          cardIds.map(id => (
            <button
              key={id}
              type="button"
              onClick={() => setOpenId(id)}
              data-testid={`thread-id-${id}`}
              aria-current={id === shownId ? 'true' : undefined}
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-xs transition-colors',
                id === shownId
                  ? 'border-accent/50 bg-bg-tertiary text-text-primary'
                  : 'border-border text-text-muted hover:text-text-primary',
              )}
            >
              {id}
            </button>
          ))
        ) : (
          <span className="text-xs text-text-muted">
            no ids: line on this card, showing the whole manifest
          </span>
        )}
      </div>
      <p className="px-4 pb-2 text-xs text-text-muted shrink-0" data-testid="thread-as-of">
        {asOfLine(status.generatedAt, status.head)}
      </p>
      {/*
        No `sandbox`, deliberately, and a test says so.

        Everything inside the frame that a reader can press is Loupe's: the proof
        snippets open, the source links resolve, a row click moves the selection. A
        `sandbox` attribute here, added later for the look of it, would take that
        scripting away and the panel would go dead with nothing on screen to say why,
        so the absence is a promise rather than an oversight.

        The frame is same-origin on purpose too: Loupe only offers source peek for an
        artifact from its own origin.
      */}
      <iframe
        key={shownId ?? 'no-id'}
        title="Thread"
        data-testid="thread-frame"
        className="w-full flex-1 min-h-0 border-0"
        src={`/loupe/index.html?${params.toString()}`}
      />
    </div>
  )
}
