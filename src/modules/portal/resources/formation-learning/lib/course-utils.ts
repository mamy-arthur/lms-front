import type { Formation, FormationModule, FormationEvaluation, CourseContent } from './types';

// ─────────────────────────────────────────────────────────
// Flatten all contents in order
// ─────────────────────────────────────────────────────────

export function flattenContents(formation: Formation): CourseContent[] {
  const items: CourseContent[] = [];
  for (const node of formation.nodes) {
    if (node.type === 'module') {
      for (const section of node.sections) {
        items.push(...section.contents);
      }
    }
  }
  return items;
}

// ─────────────────────────────────────────────────────────
// Default active id (first in_progress item or evaluation)
// ─────────────────────────────────────────────────────────

export function getDefaultActiveId(formation: Formation): string {
  for (const node of formation.nodes) {
    if (node.type === 'module') {
      for (const section of node.sections) {
        for (const content of section.contents) {
          if (content.status === 'in_progress') return content.id;
        }
      }
    }
  }
  // fallback: first non-locked content
  for (const node of formation.nodes) {
    if (node.type === 'module') {
      for (const section of node.sections) {
        const first = section.contents.find((c) => c.status !== 'locked');
        if (first) return first.id;
      }
    }
  }
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
  next: string | null;
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
    for (const node of formation.nodes) {
      if (node.type !== 'module') continue;
      for (const section of node.sections) {
        if (section.contents.some((c) => c.id === activeId)) {
          return {
            kind: 'content',
            node,
            sectionTitle: section.title,
            content,
            prev: allContents[contentIndex - 1]?.id ?? null,
            next: allContents[contentIndex + 1]?.id ?? null,
          };
        }
      }
    }
  }

  for (const node of formation.nodes) {
    if (node.type === 'evaluation' && node.id === activeId) {
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
  const all = flattenContents(formation).filter((c) => c.status !== 'locked');
  const index = all.findIndex((c) => c.id === contentId);
  return { index: index + 1, total: all.length };
}
