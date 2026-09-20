import { useMutation } from '@tanstack/react-query'
import { Loader2, Play } from 'lucide-react'
import { Button } from '../ui/button'

interface TryItPanelProps {
  projectId: string
  ticketId: string
}

interface TryResult {
  ran: boolean
  exitCode: number | null
  stdout: string
  stderr: string
  script: string
  reason?: string
}

/**
 * Try it: run what the card built, without leaving the card.
 *
 * The button sends the card's id and nothing else. What runs is `robots/try.sh` in that
 * card's worktree, a file the estate governs and this page cannot name, choose or add
 * to. There is deliberately no field to type a command into: the whole safety of this
 * button is that a request can only ever say which card.
 *
 * It appears on a card under review, because that is when somebody is asking whether
 * the thing works.
 */
export function TryItPanel({ projectId, ticketId }: TryItPanelProps) {
  const run = useMutation<TryResult, Error>({
    mutationFn: async () => {
      const response = await fetch(
        `/api/tickets/${encodeURIComponent(projectId)}/${encodeURIComponent(ticketId)}/try`,
        { method: 'POST' },
      )
      const body = await response.json()
      if (!response.ok) throw new Error(body?.reason || body?.error || `HTTP ${response.status}`)
      return body as TryResult
    },
  })

  const result = run.data
  const output = result ? [result.stdout, result.stderr].filter(Boolean).join('\n').trimEnd() : ''

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="ml-2">{run.isPending ? 'Running' : 'Try it'}</span>
        </Button>
        <span className="text-xs text-text-muted">
          Runs <code>robots/try.sh</code> on this card&apos;s branch. Nothing else, and no
          arguments.
        </span>
      </div>

      {run.isError && (
        <p className="text-sm text-red-400">{run.error.message}</p>
      )}

      {result && !result.ran && (
        <p className="text-sm text-text-muted">{result.reason ?? 'It did not run.'}</p>
      )}

      {result?.ran && (
        <>
          <p className="text-xs text-text-muted">
            {result.exitCode === 0
              ? 'Exited 0.'
              : result.exitCode === null
                ? (result.reason ?? 'It was stopped.')
                : `Exited ${result.exitCode}.`}
          </p>
          {output && (
            <pre className="max-h-96 overflow-auto rounded bg-black/30 p-3 text-xs leading-relaxed whitespace-pre-wrap">
              {output}
            </pre>
          )}
        </>
      )}
    </div>
  )
}
