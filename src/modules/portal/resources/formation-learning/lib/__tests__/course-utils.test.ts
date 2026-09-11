import { getDefaultActiveId, resolveActive } from '../course-utils';
import type { Formation, CourseContent } from '../types';

function makeContent(id: string, completed: boolean, locked = false): CourseContent {
  return {
    id,
    courseId: 'course-1',
    type: 'page',
    title: id,
    status: locked ? 'locked' : completed ? 'completed' : 'available',
    completed,
  };
}

function makeFormation(contents: CourseContent[]): Formation {
  return {
    id: 'f1',
    slug: 'f1',
    title: 'Formation',
    progress: 0,
    nodes: [
      {
        id: 'm1',
        formationId: 'f1',
        type: 'module',
        title: 'Module 1',
        status: 'available',
        progress: 0,
        order: 1,
        courses: [
          {
            id: 'course-1',
            title: 'Cours 1',
            sections: [{ id: 'sec-1', moduleId: 'm1', title: 'Section 1', contents }],
          },
        ],
      },
    ],
  };
}

describe('getDefaultActiveId', () => {
  it('returns the first non-completed non-locked content', () => {
    const contents = [makeContent('c1', true), makeContent('c2', false), makeContent('c3', false)];
    expect(getDefaultActiveId(makeFormation(contents))).toBe('c2');
  });

  it('skips completed contents and returns the first pending one', () => {
    const contents = [makeContent('c1', true), makeContent('c2', true), makeContent('c3', false)];
    expect(getDefaultActiveId(makeFormation(contents))).toBe('c3');
  });

  it('returns the last completed content when all are done', () => {
    const contents = [makeContent('c1', true), makeContent('c2', true), makeContent('c3', true)];
    expect(getDefaultActiveId(makeFormation(contents))).toBe('c3');
  });

  it('returns the first available content when nothing is completed', () => {
    const contents = [makeContent('c1', false), makeContent('c2', false)];
    expect(getDefaultActiveId(makeFormation(contents))).toBe('c1');
  });

  it('skips locked contents when looking for first non-completed', () => {
    const contents = [
      makeContent('c1', false, true), // locked
      makeContent('c2', false, false),
    ];
    expect(getDefaultActiveId(makeFormation(contents))).toBe('c2');
  });

  it('falls back to first available when all non-locked are completed', () => {
    const contents = [
      makeContent('c1', true),
      makeContent('c2', false, true), // locked
    ];
    // c1 is completed, c2 is locked — last completed is c1
    expect(getDefaultActiveId(makeFormation(contents))).toBe('c1');
  });

  it('returns empty string when formation has no nodes', () => {
    const empty: Formation = { id: 'f1', slug: 'f1', title: 'F', progress: 0, nodes: [] };
    expect(getDefaultActiveId(empty)).toBe('');
  });
});

describe('Résolution des destinations de navigation', () => {
  it('refuse de résoudre un identifiant de contenu verrouillé', () => {
    const formation = makeFormation([makeContent('c1', false), makeContent('c2', false, true)]);
    expect(resolveActive(formation, 'c2')).toBeNull();
    expect(resolveActive(formation, 'c1')).toMatchObject({
      kind: 'content',
      next: 'c2',
      isNextLocked: true,
    });
  });

  it('ne propose pas de retour vers un contenu verrouillé lors de la relecture', () => {
    const formation = makeFormation([makeContent('c1', false, true), makeContent('c2', true)]);
    expect(resolveActive(formation, 'c2')).toMatchObject({ kind: 'content', prev: null });
  });

  it('refuse une évaluation verrouillée même si son identifiant est connu', () => {
    const formation = makeFormation([]);
    formation.nodes.push({
      id: 'eval-1',
      formationId: 'f1',
      type: 'evaluation',
      evaluationType: 'final',
      title: 'Évaluation finale',
      status: 'locked',
      order: 2,
      passingScore: 70,
      questions: [],
    });
    expect(resolveActive(formation, 'eval-1')).toBeNull();
  });
});
