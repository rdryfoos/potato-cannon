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

type ThreadLens = 'thread' | 'descent'

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
 * The toggle picks which of Loupe's own views the frame shows. It is the same
 * drawing either way: Thread is one row's walk, Descent is the whole rail,
 * and this tab adds nothing to either beyond narrowing the rows to the card's
 * own ids. No card node is drawn, because a card is a lens and not a level.
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
  const [lens, setLens] = useState<ThreadLens>('thread')
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

  const params = new URLSearchParams({ manifest: manifestUrl, embed: '1', lens })
  if (cardIds.length > 0) params.set('ids', cardIds.join(','))
  if (lens === 'descent' && title) params.set('title', `${ticketId} ${title}`)

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-4 pb-2 shrink-0">
        <div className="flex rounded-md border border-border overflow-hidden">
          {(['thread', 'descent'] as const).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setLens(value)}
              className={cn(
                'px-2.5 py-1 text-xs capitalize transition-colors',
                lens === value
                  ? 'bg-bg-tertiary text-text-primary'
                  : 'text-text-muted hover:text-text-primary',
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted">
          {cardIds.length > 0
            ? `${cardIds.length} id${cardIds.length === 1 ? '' : 's'} on this card`
            : 'no ids: line on this card, showing the whole manifest'}
        </span>
      </div>
      <p className="px-4 pb-2 text-xs text-text-muted shrink-0" data-testid="thread-as-of">
        {asOfLine(status.generatedAt, status.head)}
      </p>
      <iframe
        key={lens}
        title="Thread"
        className="w-full flex-1 min-h-0 border-0"
        src={`/loupe/index.html?${params.toString()}`}
      />
    </div>
  )
}
