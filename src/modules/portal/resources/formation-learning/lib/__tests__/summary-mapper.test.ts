import { mapSummaryToFormation } from '../summary-mapper';
import type { ApiPortalLearningPathSummary } from '@/shared/types/portal.types';
import type { FormationModule, FormationEvaluation } from '../types';

const SUMMARY: ApiPortalLearningPathSummary = {
  id: 'lp-1',
  name: 'Formation Test',
  progress: { percent: 50, completed: 2, total: 4 },
  modules: [
    {
      id: 'mod-1',
      name: 'Module 1',
      accessible: true,
      progress: { percent: 100, completed: 2, total: 2 },
      courses: [
        {
          id: 'course-1',
          name: 'Cours 1',
          sections: [
            {
              id: 'sec-1',
              name: 'Section 1',
              content_entries: [
                { id: 'entry-1', title: 'Contenu A', completed: true },
                { id: 'entry-2', title: 'Contenu B', completed: true },
              ],
            },
          ],
        },
      ],
      evaluation: { id: 'eval-1', title: 'Éval 1', accessible: true, completed: false },
    },
    {
      id: 'mod-2',
      name: 'Module 2',
      accessible: false,
      progress: { percent: 0, completed: 0, total: 2 },
      courses: [
        {
          id: 'course-2',
          name: 'Cours 2',
          sections: [
            {
              id: 'sec-2',
              name: 'Section 2',
              content_entries: [
                { id: 'entry-3', title: 'Contenu C', completed: false },
                { id: 'entry-4', title: null, completed: false },
              ],
            },
          ],
        },
      ],
      evaluation: null,
    },
  ],
  final_evaluation: { id: 'final-eval', title: 'Éval finale', accessible: false, completed: false },
};

describe('mapSummaryToFormation', () => {
  it('maps formation id and name', () => {
    const result = mapSummaryToFormation(SUMMARY);
    expect(result.id).toBe('lp-1');
    expect(result.title).toBe('Formation Test');
  });

  it('maps formation progress percent', () => {
    const result = mapSummaryToFormation(SUMMARY);
    expect(result.progress).toBe(50);
  });

  it('maps accessible module to available status', () => {
    const result = mapSummaryToFormation(SUMMARY);
    const mod1 = result.nodes.find((n) => n.id === 'mod-1') as FormationModule;
    expect(mod1.status).toBe('available');
  });

  it('maps inaccessible module to locked status', () => {
    const result = mapSummaryToFormation(SUMMARY);
    const mod2 = result.nodes.find((n) => n.id === 'mod-2') as FormationModule;
    expect(mod2.status).toBe('locked');
  });

  it('maps module progress percent', () => {
    const result = mapSummaryToFormation(SUMMARY);
    const mod1 = result.nodes.find((n) => n.id === 'mod-1') as FormationModule;
    expect(mod1.progress).toBe(100);
  });

  it('maps completed entry to completed status', () => {
    const result = mapSummaryToFormation(SUMMARY);
    const mod1 = result.nodes.find((n) => n.id === 'mod-1') as FormationModule;
    const entry1 = mod1.courses[0].sections[0].contents[0];
    expect(entry1.completed).toBe(true);
    expect(entry1.status).toBe('completed');
  });

  it('maps non-completed entry in inaccessible module to locked status', () => {
    const result = mapSummaryToFormation(SUMMARY);
    const mod2 = result.nodes.find((n) => n.id === 'mod-2') as FormationModule;
    const entry3 = mod2.courses[0].sections[0].contents[0];
    expect(entry3.completed).toBe(false);
    expect(entry3.status).toBe('locked');
  });

  it('maps null entry title to empty string', () => {
    const result = mapSummaryToFormation(SUMMARY);
    const mod2 = result.nodes.find((n) => n.id === 'mod-2') as FormationModule;
    expect(mod2.courses[0].sections[0].contents[1].title).toBe('');
  });

  it('stores courseId for portal entry URL construction', () => {
    const result = mapSummaryToFormation(SUMMARY);
    const mod1 = result.nodes.find((n) => n.id === 'mod-1') as FormationModule;
    expect(mod1.courses[0].sections[0].contents[0].courseId).toBe('course-1');
  });

  it('maps accessible+non-completed evaluation to available status', () => {
    const result = mapSummaryToFormation(SUMMARY);
    const eval1 = result.nodes.find((n) => n.id === 'eval-1') as FormationEvaluation;
    expect(eval1.status).toBe('available');
  });

  it('maps inaccessible evaluation to locked status', () => {
    const result = mapSummaryToFormation(SUMMARY);
    const finalEval = result.nodes.find((n) => n.id === 'final-eval') as FormationEvaluation;
    expect(finalEval.status).toBe('locked');
  });

  it('orders nodes: modules interleaved with their evaluations, final eval last', () => {
    const result = mapSummaryToFormation(SUMMARY);
    const ids = result.nodes.map((n) => n.id);
    expect(ids).toEqual(['mod-1', 'eval-1', 'mod-2', 'final-eval']);
  });

  it('returns an empty nodes array for a summary with no modules', () => {
    const empty: ApiPortalLearningPathSummary = {
      ...SUMMARY,
      modules: [],
      final_evaluation: null,
    };
    expect(mapSummaryToFormation(empty).nodes).toHaveLength(0);
  });

  describe('read-only SCORM entries', () => {
    function previewSummary(): ApiPortalLearningPathSummary {
      const summary = JSON.parse(JSON.stringify(SUMMARY)) as ApiPortalLearningPathSummary;
      summary.progress = { percent: 0, completed: 0, total: 4 };
      summary.final_evaluation = null;
      for (const module of summary.modules) {
        module.accessible = true;
        module.progress = { percent: 0, completed: 0, total: 2 };
        module.evaluation = null;
        for (const course of module.courses) {
          for (const section of course.sections) {
            for (const entry of section.content_entries) entry.completed = false;
          }
        }
      }
      for (const entry of summary.modules[0].courses[0].sections[0].content_entries) {
        entry.read_only = true;
      }
      return summary;
    }

    it('maps read_only to readOnly and unlocks the next entry across modules without inventing completion or progress', () => {
      const summary = previewSummary();
      const before = JSON.parse(JSON.stringify(summary)) as ApiPortalLearningPathSummary;
      const result = mapSummaryToFormation(summary);
      const modules = result.nodes.filter(
        (node): node is FormationModule => node.type === 'module',
      );
      const contents = modules.flatMap((module) =>
        module.courses.flatMap((course) => course.sections.flatMap((section) => section.contents)),
      );

      expect(
        contents.map(({ entryId, readOnly, completed, status }) => ({
          entryId,
          readOnly,
          completed,
          status,
        })),
      ).toEqual([
        { entryId: 'entry-1', readOnly: true, completed: false, status: 'available' },
        { entryId: 'entry-2', readOnly: true, completed: false, status: 'available' },
        { entryId: 'entry-3', readOnly: undefined, completed: false, status: 'available' },
        { entryId: 'entry-4', readOnly: undefined, completed: false, status: 'locked' },
      ]);
      expect(result.progress).toBe(0);
      expect(modules.map((module) => module.progress)).toEqual([0, 0]);
      expect(summary).toEqual(before);
    });

    it.each([undefined, false])(
      'does not clear an earlier ordinary unmet prerequisite (read_only=%s)',
      (readOnly) => {
        const summary = previewSummary();
        summary.modules[0].courses[0].sections[0].content_entries[0].read_only = readOnly;
        const result = mapSummaryToFormation(summary);
        const firstModule = result.nodes[0] as FormationModule;
        const nextModule = result.nodes[1] as FormationModule;

        expect(firstModule.courses[0].sections[0].contents[0]).toMatchObject({
          completed: false,
          status: 'available',
        });
        expect(firstModule.courses[0].sections[0].contents[0].readOnly).toBeUndefined();
        expect(firstModule.courses[0].sections[0].contents[1]).toMatchObject({
          readOnly: true,
          completed: false,
          status: 'locked',
        });
        expect(nextModule.courses[0].sections[0].contents.map((content) => content.status)).toEqual(
          ['locked', 'locked'],
        );
        expect(result.progress).toBe(0);
        expect(firstModule.progress).toBe(0);
        expect(nextModule.progress).toBe(0);
      },
    );

    it('does not override a server-locked module after read-only entries', () => {
      const summary = previewSummary();
      summary.modules[1].accessible = false;
      const result = mapSummaryToFormation(summary);
      const nextModule = result.nodes[1] as FormationModule;

      expect(nextModule.status).toBe('locked');
      expect(
        nextModule.courses[0].sections[0].contents.every(
          (content) => content.status === 'locked' && content.completed === false,
        ),
      ).toBe(true);
      expect(nextModule.progress).toBe(0);
      expect(result.progress).toBe(0);
    });
  });
});
