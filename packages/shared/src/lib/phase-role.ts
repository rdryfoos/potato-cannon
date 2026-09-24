/**
 * What a column is for, rather than what it is called.
 *
 * Buttons and checks decided by column name: `phase === 'Review' || phase === 'Align'`,
 * repeated wherever somebody needed to know whether a card was under review. Every
 * project that renamed a column had to be added to every one of those lists, and a
 * project nobody had thought of simply lost the button.
 *
 * A template may now say what a column is for. A template that says nothing is read by
 * its names, exactly as before, so a board that still says Align keeps working and
 * nothing has to be renamed for anything to keep running.
 */
export type PhaseRole = 'ideas' | 'spec' | 'build' | 'gate' | 'review' | 'done'

/** What a column's name means when the template did not say. */
const BY_NAME: Record<string, PhaseRole> = {
  ideas: 'ideas',
  backlog: 'ideas',
  inbox: 'ideas',
  spec: 'spec',
  specification: 'spec',
  refinement: 'spec',
  build: 'build',
  development: 'build',
  gate: 'gate',
  verification: 'gate',
  review: 'review',
  align: 'review',
  done: 'done',
  archived: 'done',
}

export interface PhaseLike {
  name?: string
  role?: string
}

/** The role a single column declares, or the one its name implies, or null. */
export function phaseRole(phase?: PhaseLike | string | null): PhaseRole | null {
  if (!phase) return null
  if (typeof phase === 'string') return BY_NAME[phase.trim().toLowerCase()] ?? null
  const declared = String(phase.role ?? '').trim().toLowerCase()
  if (declared && declared in BY_NAME) return BY_NAME[declared]
  return BY_NAME[String(phase.name ?? '').trim().toLowerCase()] ?? null
}

/**
 * The role of the named column on a board, using the template when there is one.
 *
 * The template is the authority: a project that calls its review column Align and says
 * so gets 'review' from the declaration rather than from this file's list of names.
 */
export function roleOf(phaseName?: string | null, phases?: PhaseLike[] | null): PhaseRole | null {
  const name = String(phaseName ?? '').trim().toLowerCase()
  if (!name) return null
  const declared = (phases ?? []).find((p) => String(p?.name ?? '').trim().toLowerCase() === name)
  return phaseRole(declared ?? name)
}
