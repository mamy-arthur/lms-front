import {
  formatAttemptDate,
  formatAttemptDuration,
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
