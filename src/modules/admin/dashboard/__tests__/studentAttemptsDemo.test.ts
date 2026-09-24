import {
  formatAttemptDate,
  formatAttemptDuration,
  getAttemptMinutes,
  getDemoEnrollmentSummary,
  getDemoStudentAttempts,
} from '../data/studentAttemptsDemo';
import {
  enrollmentStatuses,
  formationProgressDemo,
  getDemoFormationStudents,
} from '../data/studentProgressDemo';

describe('historique des tentatives de démonstration', () => {
  it.each(enrollmentStatuses)(
    'respecte le statut courant $key et l’ordre des étapes',
    ({ key }) => {
      const formation = formationProgressDemo[0];
      const student = getDemoFormationStudents(formation, key)[0];
      const attempts = getDemoStudentAttempts(formation, key, student.id);
      if (key === 'not_started') {
        expect(attempts).toEqual([]);
        return;
      }

      expect(attempts).toHaveLength(2);
      expect(attempts[0].outcome).toBe('failed');
      expect(attempts[1].outcome).toBe(key);
      expect(attempts[1].restartReason).toContain('Reprise depuis le début');
      expect(new Date(attempts[1].startedAt).getTime()).toBeGreaterThan(
        new Date(attempts[0].endedAt!).getTime(),
      );
      attempts.forEach((attempt) => {
        expect(attempt.steps.map((step) => step.title)).toEqual([
          'Module 1',
          'Évaluation 1',
          'Module 2',
          'Évaluation 2',
          'Module 3',
          'Évaluation 3',
        ]);
        expect(attempt.steps[0]).toMatchObject({
          state: 'completed',
          minutes: attempt.number === 1 ? 180 : 240,
        });
        if (attempt.outcome === 'failed') {
          const failedIndex = attempt.steps.findIndex((step) => step.state === 'failed');
          expect(attempt.steps[failedIndex].kind).toBe('evaluation');
          expect(attempt.interruptionReason).toMatch(/Échec à l’évaluation/);
          attempt.steps.slice(failedIndex + 1).forEach((step) => {
            expect(step).toMatchObject({ state: 'locked' });
            if (step.state === 'locked') {
              expect(step.reason).toContain(
                `Échec à l’évaluation ${Math.floor(failedIndex / 2) + 1}`,
              );
              expect(step).not.toHaveProperty('minutes');
            }
          });
        }
        if (attempt.outcome === 'completed') {
          expect(attempt.steps.every((step) => step.state === 'completed')).toBe(true);
        }
        if (attempt.outcome === 'in_progress') {
          expect(attempt.endedAt).toBeUndefined();
          expect(attempt.interruptionReason).toBeUndefined();
          expect(attempt.steps[2]).toMatchObject({ state: 'in_progress' });
          expect(attempt.steps[3]).toMatchObject({
            state: 'locked',
            reason: expect.stringContaining('module 2 est en cours'),
          });
        }
      });
    },
  );

  it('garde le module terminé avant l’échec à la dernière évaluation', () => {
    const formation = formationProgressDemo[0];
    const student = getDemoFormationStudents(formation, 'failed')[1];
    const attempt = getDemoStudentAttempts(formation, 'failed', student.id)[1];
    expect(attempt.steps[4]).toMatchObject({ state: 'completed', kind: 'module' });
    expect(attempt.steps[5]).toMatchObject({ state: 'failed', kind: 'evaluation' });
  });

  it('fait correspondre la somme des cours au temps de chaque module et chaque tentative', () => {
    formationProgressDemo.forEach((formation) => {
      enrollmentStatuses.forEach(({ key }) => {
        const student = getDemoFormationStudents(formation, key)[0];
        getDemoStudentAttempts(formation, key, student.id).forEach((attempt) => {
          attempt.steps.forEach((step) => {
            if (step.kind === 'evaluation') {
              expect(step).not.toHaveProperty('courses');
              return;
            }
            if (step.state === 'locked') {
              expect(step.courses).toEqual([]);
              return;
            }
            expect(step.courses).toHaveLength(3);
            expect(new Set(step.courses.map((course) => course.id)).size).toBe(3);
            expect(step.courses.reduce((total, course) => total + course.minutes, 0)).toBe(
              step.minutes,
            );
            step.courses.forEach((course) => {
              expect(course.minutes).toBeGreaterThanOrEqual(0);
              expect(Number.isInteger(course.minutes)).toBe(true);
              if (course.state === 'not_started') expect(course.minutes).toBe(0);
              if (step.state === 'completed') expect(course.state).toBe('completed');
            });
          });
        });
      });
    });
  });

  it('isole les historiques par étudiant et par formation sans modifier les fixtures', () => {
    const formation = formationProgressDemo[0];
    const [first, second] = getDemoFormationStudents(formation, 'completed');
    const attempts = getDemoStudentAttempts(formation, 'completed', first.id);
    expect(attempts).toEqual(getDemoStudentAttempts(formation, 'completed', first.id));
    expect(attempts[0].id).not.toBe(
      getDemoStudentAttempts(formation, 'completed', second.id)[0].id,
    );
    const other = formationProgressDemo[2];
    // Étudiant 001 is also enrolled in the third formation.
    expect(attempts[0].id).not.toBe(getDemoStudentAttempts(other, 'completed', first.id)[0].id);
    attempts[0].steps.pop();
    expect(getDemoStudentAttempts(formation, 'completed', first.id)[0].steps).toHaveLength(6);
    expect(getDemoStudentAttempts(formation, 'completed', 'unknown')).toEqual([]);
    expect(getDemoStudentAttempts(formation, 'failed', first.id)).toEqual([]);
  });

  it.each([
    [0, '0 min'],
    [35, '35 min'],
    [180, '3 h'],
    [240, '4 h'],
    [90, '1 h 30 min'],
  ])('formate %i minutes en %s', (minutes, expected) => {
    expect(formatAttemptDuration(Number(minutes))).toBe(expected);
  });

  it('formate les dates françaises de manière stable', () => {
    expect(formatAttemptDate('2026-09-01T23:30:00Z')).toContain('1 sept. 2026');
  });
});

describe('synthèse d’inscription', () => {
  const formation = formationProgressDemo[0];
  /** Repère fixe : le calcul de retard ne doit pas dépendre de l’horloge. */
  const now = Date.UTC(2026, 8, 20);

  it('résume un parcours terminé dans les temps', () => {
    const [student] = getDemoFormationStudents(formation, 'failed');
    const attempts = getDemoStudentAttempts(formation, 'failed', student.id);

    expect(getDemoEnrollmentSummary(formation, 'failed', student.id, now)).toEqual({
      startedAt: attempts[0].startedAt,
      endedAt: attempts[1].endedAt,
      dueAt: '2026-10-09T09:00:00.000Z',
      accessDays: 35,
      attempts: 2,
      minutes: 570,
      lateness: 'on_time',
    });
  });

  it('signale un parcours terminé après son échéance', () => {
    const student = getDemoFormationStudents(formation, 'failed')[1];
    const summary = getDemoEnrollmentSummary(formation, 'failed', student.id, now);

    expect(summary.lateness).toBe('finished_late');
    expect(Date.parse(summary.endedAt!)).toBeGreaterThan(Date.parse(summary.dueAt));
  });

  it('signale un parcours jamais démarré dont l’échéance est dépassée', () => {
    const [student] = getDemoFormationStudents(formation, 'not_started');

    expect(getDemoEnrollmentSummary(formation, 'not_started', student.id, now)).toEqual({
      startedAt: undefined,
      endedAt: undefined,
      dueAt: '2026-09-11T09:00:00.000Z',
      accessDays: 7,
      attempts: 0,
      minutes: 0,
      lateness: 'late',
    });
  });

  it('ne déclare pas en retard un parcours non terminé avant son échéance', () => {
    const [student] = getDemoFormationStudents(formation, 'not_started');
    const before = Date.UTC(2026, 8, 5);

    expect(getDemoEnrollmentSummary(formation, 'not_started', student.id, before).lateness).toBe(
      'on_time',
    );
  });

  it('laisse la date de fin ouverte tant que la dernière tentative est en cours', () => {
    const [student] = getDemoFormationStudents(formation, 'in_progress');
    const summary = getDemoEnrollmentSummary(formation, 'in_progress', student.id, now);

    expect(summary.endedAt).toBeUndefined();
    expect(summary.startedAt).toBeDefined();
    expect(summary.attempts).toBe(2);
  });

  it('expose une durée d’accès cohérente avec l’échéance', () => {
    const durations = new Set(
      formationProgressDemo.flatMap((item) =>
        enrollmentStatuses.flatMap(({ key }) =>
          getDemoFormationStudents(item, key).map((student) => {
            const summary = getDemoEnrollmentSummary(item, key, student.id, now);
            // L'accès court de l'ouverture à l'échéance, tentative ou pas.
            expect(summary.accessDays).toBeGreaterThan(0);
            return summary.accessDays;
          }),
        ),
      ),
    );

    expect([...durations].sort((a, b) => a - b)).toEqual([7, 14, 21, 28, 35]);
  });

  it('ne compte pas les étapes verrouillées dans le temps passé', () => {
    const [student] = getDemoFormationStudents(formation, 'failed');
    const [first] = getDemoStudentAttempts(formation, 'failed', student.id);
    const locked = first.steps.filter((step) => step.state === 'locked');

    expect(locked.length).toBeGreaterThan(0);
    expect(getAttemptMinutes(first.steps)).toBe(
      first.steps.reduce((total, step) => total + (step.state === 'locked' ? 0 : step.minutes), 0),
    );
  });

  it('fait coïncider le temps passé avec l’écart entre début et fin de tentative', () => {
    let checked = 0;

    formationProgressDemo.forEach((item) =>
      enrollmentStatuses.forEach(({ key }) =>
        getDemoFormationStudents(item, key).forEach((student) =>
          getDemoStudentAttempts(item, key, student.id).forEach((attempt) => {
            if (!attempt.endedAt) return;
            expect((Date.parse(attempt.endedAt) - Date.parse(attempt.startedAt)) / 60_000).toBe(
              getAttemptMinutes(attempt.steps),
            );
            checked += 1;
          }),
        ),
      ),
    );

    expect(checked).toBe(243);
  });

  it('cumule le temps passé de toutes les tentatives', () => {
    const [student] = getDemoFormationStudents(formation, 'completed');
    const attempts = getDemoStudentAttempts(formation, 'completed', student.id);

    expect(attempts.map((attempt) => getAttemptMinutes(attempt.steps))).toEqual([200, 450]);
    expect(getDemoEnrollmentSummary(formation, 'completed', student.id, now).minutes).toBe(650);
    expect(formatAttemptDuration(650)).toBe('10 h 50 min');
  });

  it('couvre les trois états de retard sur l’ensemble des fixtures', () => {
    const states = new Set(
      formationProgressDemo.flatMap((item) =>
        enrollmentStatuses.flatMap(({ key }) =>
          getDemoFormationStudents(item, key).map(
            (student) => getDemoEnrollmentSummary(item, key, student.id, now).lateness,
          ),
        ),
      ),
    );

    expect(states).toEqual(new Set(['on_time', 'late', 'finished_late']));
  });
});
