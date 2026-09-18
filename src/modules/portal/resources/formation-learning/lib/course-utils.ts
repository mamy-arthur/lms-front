import type {
  Formation,
  FormationModule,
  FormationEvaluation,
  CourseContent,
  ProgressStatus,
} from './types';

// ─────────────────────────────────────────────────────────
// Flatten all contents in order
// ─────────────────────────────────────────────────────────

/**
 * Suite des étapes franchissables, contenus ET évaluations mêlés dans l'ordre
 * figé. Le sommaire saute les évaluations, pas le parcours : sans elles, la
 * navigation enjamberait l'épreuve qui conditionne la suite.
 */
export function formationSteps(formation: Formation): { id: string; status: ProgressStatus }[] {
  const steps: { id: string; status: ProgressStatus }[] = [];
  for (const node of formation.nodes) {
    if (node.type === 'evaluation') {
      steps.push({ id: node.id, status: node.status });
      continue;
    }
    for (const course of node.courses) {
      for (const section of course.sections) {
        steps.push(
          ...section.contents.map((content) => ({ id: content.id, status: content.status })),
        );
      }
    }
  }

  return steps;
}

export function flattenContents(formation: Formation): CourseContent[] {
  const items: CourseContent[] = [];
  for (const node of formation.nodes) {
    if (node.type === 'module') {
      for (const course of node.courses) {
        for (const section of course.sections) {
          items.push(...section.contents);
        }
      }
    }
  }
  return items;
}

// ─────────────────────────────────────────────────────────
// Default active id (first non-completed content in accessible module)
// ─────────────────────────────────────────────────────────

export function getDefaultActiveId(formation: Formation): string {
  // Le moteur désigne lui-même le nœud à travailler : on y atterrit plutôt que
  // sur le premier contenu lisible, qui appartient souvent à un passage clos.
  const current = formation.nodes.find((node) => node.execution.actionable);
  if (current) {
    if (current.type === 'evaluation') return current.id;

    const contents = current.courses.flatMap((course) =>
      course.sections.flatMap((section) => section.contents),
    );
    const pending = contents.find((c) => !c.completed && c.status !== 'locked');
    if (pending) return pending.id;

    const last = [...contents].reverse().find((c) => c.status !== 'locked');
    if (last) return last.id;
  }

  const allContents = flattenContents(formation);

  // First content that is not yet completed (and not locked).
  const resume = allContents.find((c) => !c.completed && c.status !== 'locked');
  if (resume) return resume.id;

  // All done or all locked — land on the last completed content.
  const lastCompleted = [...allContents].reverse().find((c) => c.completed);
  if (lastCompleted) return lastCompleted.id;

  // Absolute fallback: first available content.
  const first = allContents.find((c) => c.status !== 'locked');
  if (first) return first.id;

  return formation.nodes[0]?.id ?? '';
}

// ─────────────────────────────────────────────────────────
// Resolved types
// ─────────────────────────────────────────────────────────

export interface ResolvedContent {
  kind: 'content';
  node: FormationModule;
  sectionTitle: string;
  content: CourseContent;
  prev: string | null;
  /** Immediate successor, potentially unlocked only after completion. */
  next: string | null;
  isNextLocked: boolean;
}

export interface ResolvedEvaluation {
  kind: 'evaluation';
  node: FormationEvaluation;
}

export type Resolved = ResolvedContent | ResolvedEvaluation | null;

// ─────────────────────────────────────────────────────────
// Resolve active id to full context
// ─────────────────────────────────────────────────────────

export function resolveActive(formation: Formation, activeId: string): Resolved {
  const allContents = flattenContents(formation);
  const contentIndex = allContents.findIndex((c) => c.id === activeId);

  if (contentIndex !== -1) {
    const content = allContents[contentIndex];
    if (content.status === 'locked') return null;

    const steps = formationSteps(formation);
    const stepIndex = steps.findIndex((step) => step.id === activeId);
    const prev = steps[stepIndex - 1];
    const next = steps[stepIndex + 1];
    for (const node of formation.nodes) {
      if (node.type !== 'module') continue;
      for (const course of node.courses) {
        for (const section of course.sections) {
          if (section.contents.some((c) => c.id === activeId)) {
            return {
              kind: 'content',
              node,
              sectionTitle: section.title,
              content,
              prev: prev && prev.status !== 'locked' ? prev.id : null,
              next: next?.id ?? null,
              isNextLocked: next?.status === 'locked',
            };
          }
        }
      }
    }
  }

  for (const node of formation.nodes) {
    if (node.type === 'evaluation' && node.id === activeId) {
      if (node.status === 'locked') return null;
      return { kind: 'evaluation', node };
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────
// Content position label
// ─────────────────────────────────────────────────────────

export function getContentPosition(
  formation: Formation,
  contentId: string,
): { index: number; total: number } {
  const all = flattenContents(formation);
  const index = all.findIndex((c) => c.id === contentId);
  return { index: index + 1, total: all.length };
}
