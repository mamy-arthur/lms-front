import {
  getDemoFormationStudents,
  type DashboardEnrollmentStatus,
  type FormationProgressDemo,
} from './studentProgressDemo';

export type FormationStudentDemo = ReturnType<typeof getDemoFormationStudents>[number];

export type AttemptCourseDemo = {
  id: string;
  title: string;
  state: 'completed' | 'in_progress' | 'not_started';
  minutes: number;
};

export type AttemptStepDemo = {
  id: string;
  title: string;
} & ({ kind: 'module'; courses: AttemptCourseDemo[] } | { kind: 'evaluation' }) &
  (
    | { state: 'completed' | 'failed' | 'in_progress'; minutes: number }
    | { state: 'locked'; reason: string }
  );

export type StudentAttemptDemo = {
  id: string;
  number: number;
  startedAt: string;
  endedAt?: string;
  outcome: 'completed' | 'failed' | 'in_progress';
  restartReason?: string;
  interruptionReason?: string;
  steps: AttemptStepDemo[];
};

function buildModuleCourses(
  moduleNumber: number,
  minutes: number,
  inProgress: boolean,
): AttemptCourseDemo[] {
  const first = inProgress ? 20 : Math.floor(minutes / 4);
  const second = inProgress ? minutes - first : Math.floor(minutes / 3);
  const courseMinutes = [first, second, minutes - first - second];

  return ['Introduction', 'Concepts clés', 'Mise en pratique'].map((title, index) => ({
    id: `module-${moduleNumber}-course-${index + 1}`,
    title: `Cours ${index + 1} — ${title}`,
    state: inProgress && index > 0 ? (index === 1 ? 'in_progress' : 'not_started') : 'completed',
    minutes: courseMinutes[index],
  }));
}

function buildSteps(
  attemptNumber: number,
  outcome: StudentAttemptDemo['outcome'],
  stoppingStep: number,
): AttemptStepDemo[] {
  return Array.from({ length: 6 }, (_, index) => {
    const moduleNumber = Math.floor(index / 2) + 1;
    const kind = index % 2 === 0 ? 'module' : 'evaluation';
    const base = {
      id: `${kind}-${moduleNumber}`,
      title: `${kind === 'module' ? 'Module' : 'Évaluation'} ${moduleNumber}`,
    } as const;

    if (outcome !== 'completed' && index > stoppingStep) {
      return {
        ...base,
        ...(kind === 'module' ? { kind, courses: [] } : { kind }),
        state: 'locked',
        reason:
          outcome === 'failed'
            ? `Échec à l’évaluation ${Math.floor(stoppingStep / 2) + 1} : cette tentative est interrompue.`
            : 'Le module 2 est en cours. Les étapes précédentes doivent être terminées et leurs évaluations réussies.',
      };
    }

    const state = index === stoppingStep ? outcome : 'completed';
    const moduleMinutes = [attemptNumber === 1 ? 180 : 240, 90, 60];
    const minutes =
      state === 'in_progress' ? 35 : kind === 'module' ? moduleMinutes[moduleNumber - 1] : 20;
    return {
      ...base,
      ...(kind === 'module'
        ? { kind, courses: buildModuleCourses(moduleNumber, minutes, state === 'in_progress') }
        : { kind }),
      state,
      minutes,
    };
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Dates d'inscription d'un étudiant : démarrage prévu et échéance du parcours.
 * Source unique pour les tentatives et pour la synthèse, afin que les deux ne
 * puissent pas diverger.
 */
function getEnrollmentDates(studentId: string) {
  const studentNumber = Number(studentId.replace('demo-student-', ''));
  const startedAt = Date.UTC(2026, 8, 1 + (studentNumber % 4), 9);
  return {
    studentNumber,
    startedAt,
    /**
     * Échéance : 1 à 5 semaines après le démarrage, selon l'étudiant. La borne
     * basse est volontairement courte — une tentative aboutie s'étale sur une
     * semaine, donc seule une échéance à 7 jours produit des parcours terminés
     * hors délai. Sans cela, l'état `finished_late` serait inatteignable.
     */
    dueAt: startedAt + (7 + (studentNumber % 5) * 7) * DAY_MS,
  };
}

/**
 * Temps réellement passé sur une tentative : les étapes verrouillées n'ont pas
 * été abordées et ne comptent pas. Sert à la fois à dater la fin de la
 * tentative et à alimenter la colonne « Temps passé ».
 */
export function getAttemptMinutes(steps: AttemptStepDemo[]) {
  return steps.reduce((total, step) => total + (step.state === 'locked' ? 0 : step.minutes), 0);
}

/** Frontend-only fixtures: histories belong to a student AND a formation. */
export function getDemoStudentAttempts(
  formation: FormationProgressDemo,
  status: DashboardEnrollmentStatus,
  studentId: string,
): StudentAttemptDemo[] {
  const students = getDemoFormationStudents(formation, status);
  const studentIndex = students.findIndex((student) => student.id === studentId);
  if (studentIndex === -1 || status === 'not_started') return [];

  const { studentNumber, startedAt: baseDate } = getEnrollmentDates(studentId);
  const latestStoppingStep = status === 'in_progress' ? 2 : studentNumber % 2 === 0 ? 5 : 3;

  return [1, 2].map((number) => {
    const outcome = number === 1 ? 'failed' : status;
    const stoppingStep = number === 1 ? 1 : latestStoppingStep;
    const steps = buildSteps(number, outcome, stoppingStep);
    const startedAt = baseDate + (number - 1) * 7 * 24 * 60 * 60 * 1000;
    const minutes = getAttemptMinutes(steps);

    return {
      id: `${formation.id}-${studentId}-attempt-${number}`,
      number,
      startedAt: new Date(startedAt).toISOString(),
      endedAt:
        outcome === 'in_progress'
          ? undefined
          : new Date(startedAt + minutes * 60_000).toISOString(),
      outcome,
      restartReason:
        number === 2
          ? 'Reprise depuis le début après l’échec à l’évaluation 1 de la tentative 1.'
          : undefined,
      interruptionReason:
        outcome === 'failed'
          ? `Échec à l’évaluation ${Math.floor(stoppingStep / 2) + 1}. Une nouvelle tentative doit reprendre le parcours depuis le début.`
          : undefined,
      steps,
    };
  });
}

/**
 * Retard d'un parcours vis-à-vis de son échéance.
 * - `late` : échéance dépassée alors que le parcours n'est pas terminé.
 * - `finished_late` : parcours terminé, mais après l'échéance.
 * - `on_time` : tout le reste.
 */
export type EnrollmentLateness = 'on_time' | 'late' | 'finished_late';

export type EnrollmentSummaryDemo = {
  /** Début de la première tentative — absent tant que rien n'est commencé. */
  startedAt?: string;
  /** Fin de la dernière tentative — absent tant que le parcours est en cours. */
  endedAt?: string;
  dueAt: string;
  /** Durée d'accès au parcours, en jours : de l'ouverture jusqu'à l'échéance. */
  accessDays: number;
  /**
   * Dernier jour d'accès réel : l'échéance de l'étudiant, sauf si la formation
   * expire avant — auquel cas c'est l'expiration qui s'applique.
   */
  accessEndsAt: string;
  /** Vrai quand c'est l'expiration de la formation qui écourte l'accès. */
  cappedByFormation: boolean;
  attempts: number;
  /** Temps passé cumulé sur toutes les tentatives, en minutes. */
  minutes: number;
  lateness: EnrollmentLateness;
};

/**
 * Synthèse affichée dans la liste des étudiants, avant d'ouvrir l'historique.
 *
 * @param now Injectable pour rendre le calcul de retard déterministe en test.
 */
export function getDemoEnrollmentSummary(
  formation: FormationProgressDemo,
  status: DashboardEnrollmentStatus,
  studentId: string,
  now: number = Date.now(),
): EnrollmentSummaryDemo {
  // `openedAt` est l'ouverture de l'accès, qui existe même sans tentative —
  // contrairement à `startedAt` ci-dessous, absent tant que rien n'est commencé.
  const { startedAt: openedAt, dueAt } = getEnrollmentDates(studentId);
  const attempts = getDemoStudentAttempts(formation, status, studentId);
  const endedAt = attempts[attempts.length - 1]?.endedAt;
  const formationExpiresAt = Date.parse(formation.expiresAt);
  const cappedByFormation = formationExpiresAt < dueAt;

  return {
    startedAt: attempts[0]?.startedAt,
    endedAt,
    dueAt: new Date(dueAt).toISOString(),
    accessDays: Math.round((dueAt - openedAt) / DAY_MS),
    accessEndsAt: new Date(cappedByFormation ? formationExpiresAt : dueAt).toISOString(),
    cappedByFormation,
    attempts: attempts.length,
    minutes: attempts.reduce((total, attempt) => total + getAttemptMinutes(attempt.steps), 0),
    lateness: endedAt
      ? Date.parse(endedAt) > dueAt
        ? 'finished_late'
        : 'on_time'
      : now > dueAt
        ? 'late'
        : 'on_time',
  };
}

export function formatAttemptDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  return `${hours} h${remainder ? ` ${remainder} min` : ''}`;
}

/** Format numérique JJ/MM/AAAA, pour les dates de gestion (accès, expiration). */
export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

export function formatAttemptDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}
