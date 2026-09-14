import type { Formation, FormationModule, FormationEvaluation, CourseContent } from './types';

// ─────────────────────────────────────────────────────────
// Flatten all contents in order
// ─────────────────────────────────────────────────────────

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

    const prev = allContents[contentIndex - 1];
    const next = allContents[contentIndex + 1];
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
