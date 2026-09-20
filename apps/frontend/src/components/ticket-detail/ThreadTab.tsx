import { useQuery } from '@tanstack/react-query'
import { Loader2, GitBranch } from 'lucide-react'

interface ThreadTabProps {
  projectId: string
  ticketId: string
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
 */
export function ThreadTab({ projectId, ticketId }: ThreadTabProps) {
  const manifestUrl = `/api/tickets/${encodeURIComponent(projectId)}/${encodeURIComponent(ticketId)}/trace-manifest.json`

  // Asked before the frame is mounted so a card with no thread yet gets a
  // plain answer here, rather than Loupe's own "could not load" -- which is
  // written for someone holding a URL, and tells a reader of this pane to go
  // look in samples/.
  const { data: status, isLoading } = useQuery({
    queryKey: ['thread-manifest', projectId, ticketId],
    queryFn: async () => {
      const res = await fetch(manifestUrl)
      if (res.ok) return { present: true as const }
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

  return (
    <iframe
      title="Thread"
      className="w-full h-full border-0"
      src={`/loupe/index.html?manifest=${encodeURIComponent(manifestUrl)}&embed=1`}
    />
  )
}
