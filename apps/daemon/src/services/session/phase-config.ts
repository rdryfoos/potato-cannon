import type { Phase } from '../../types/template.types.js';
import { getProjectById, updateProjectTemplate } from '../../stores/project.store.js';
import { getTemplateWithFullPhasesForProject } from '../../stores/template.store.js';
import { hasProjectTemplate, copyTemplateToProject } from '../../stores/project-template.store.js';
import { DEFAULT_PHASES } from '@potato-cannon/shared';

/**
 * The project's phases in board order, Ideas first.
 *
 * Every caller that needs to know whether a move went forwards or backwards needs this
 * and there was nowhere to get it: the template holds the phases, the daemon injects
 * Ideas and Done around them, and the answer was assembled by hand wherever it was
 * wanted. Falls back to the default phases for a project with no template, so a caller
 * gets an order rather than an exception.
 */
export async function orderedPhases(projectId: string): Promise<string[]> {
  try {
    const project = await getProjectById(projectId);
    if (!project?.template) return [...DEFAULT_PHASES];
    const template = await getTemplateWithFullPhasesForProject(projectId);
    const names = (template?.phases ?? []).map((p: Phase) => p.name).filter(Boolean);
    if (names.length === 0) return [...DEFAULT_PHASES];
    const out = [...names];
    if (out[0] !== "Ideas") out.unshift("Ideas");
    if (out[out.length - 1] !== "Done") out.push("Done");
    return out;
  } catch {
    return [...DEFAULT_PHASES];
  }
}

/**
 * Check if a phase is automated for a project.
 */
export async function isPhaseAutomated(
  projectId: string,
  phaseName: string
): Promise<boolean> {
  const project = await getProjectById(projectId);
  return project?.automatedPhases?.includes(phaseName) ?? false;
}

/**
 * Get phase configuration from project's template.
 * Throws if project has no template assigned.
 */
export async function getPhaseConfig(
  projectId: string,
  phaseName: string
): Promise<Phase | null> {
  const project = await getProjectById(projectId);
  if (!project?.template) {
    throw new Error(`Project ${projectId} has no template assigned`);
  }

  // Auto-migrate: copy template if project doesn't have local copy
  if (!(await hasProjectTemplate(projectId))) {
    try {
      const copied = await copyTemplateToProject(projectId, project.template.name);
      await updateProjectTemplate(projectId, project.template.name, copied.version);
      console.log(`[phase-config] Migrated template for project ${projectId}`);
    } catch (error) {
      console.error(`[phase-config] Failed to migrate template: ${(error as Error).message}`);
      // Continue with global template as fallback
    }
  }

  const template = await getTemplateWithFullPhasesForProject(projectId);
  if (!template) {
    throw new Error(`Template ${project.template.name} not found`);
  }

  return template.phases.find(p => p.id === phaseName || p.name === phaseName) || null;
}

/**
 * Get the next phase after completing the current one.
 */
export async function getNextPhase(
  projectId: string,
  currentPhaseName: string
): Promise<string | null> {
  const phase = await getPhaseConfig(projectId, currentPhaseName);
  return phase?.transitions?.next || null;
}

/**
 * Resolve the actual target phase, skipping automated manual checkpoints.
 * Only skips phases that are automated AND have no workers (pure manual gates).
 * Phases with workers (agents, answerBot, etc.) always run — the answerBot
 * handles questions automatically when the phase is automated.
 */
export async function resolveTargetPhase(
  projectId: string,
  requestedPhase: string
): Promise<string> {
  const project = await getProjectById(projectId);
  if (!project?.template) {
    return requestedPhase; // No template, can't resolve
  }

  const template = await getTemplateWithFullPhasesForProject(projectId);
  if (!template) {
    return requestedPhase;
  }

  const phases = template.phases;
  const startIndex = phases.findIndex(p => p.name === requestedPhase || p.id === requestedPhase);

  if (startIndex === -1) {
    return requestedPhase; // Phase not found, return as-is
  }

  // Find first phase that should not be skipped
  for (let i = startIndex; i < phases.length; i++) {
    const phase = phases[i];
    const isAutomated = project.automatedPhases?.includes(phase.name) ?? false;

    // Only skip automated phases that are pure manual checkpoints (no workers)
    // Phases with workers should always run — answerBot handles questions
    const isManualCheckpoint = phase.transitions?.manual === true &&
      (!phase.workers || phase.workers.length === 0);

    if (!isAutomated || !isManualCheckpoint) {
      return phase.name;
    }
  }

  // All remaining phases are automated manual checkpoints - return last phase
  return phases[phases.length - 1].name;
}

/**
 * Get the next enabled phase after completing the current one.
 * Used by completePhase() to skip automated phases.
 */
export async function getNextEnabledPhase(
  projectId: string,
  currentPhaseName: string
): Promise<string | null> {
  const nextPhase = await getNextPhase(projectId, currentPhaseName);
  if (!nextPhase) {
    return null;
  }
  return resolveTargetPhase(projectId, nextPhase);
}

/**
 * Check if a phase requires a worktree.
 */
export async function phaseRequiresWorktree(
  projectId: string,
  phaseName: string
): Promise<boolean> {
  const phase = await getPhaseConfig(projectId, phaseName);
  return phase?.requiresWorktree || false;
}
