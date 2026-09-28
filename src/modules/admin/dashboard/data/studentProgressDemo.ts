/**
 * Données de démo du panneau étudiants, en attente de son branchement API (ticket suivant).
 * Le dashboard Éditeur n'en dépend plus : sa config de statuts est `data/enrollmentStatuses.ts`.
 */
export const enrollmentStatuses = [
  {
    key: 'completed',
    label: 'Terminées avec succès',
    badgeLabel: 'terminés',
    color: 'bg-emerald-500',
    badgeClassName:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    key: 'in_progress',
    label: 'En cours',
    badgeLabel: 'en cours',
    color: 'bg-amber-500',
    badgeClassName:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    key: 'not_started',
    label: 'Non commencées',
    badgeLabel: 'non commencés',
    color: 'bg-slate-400',
    badgeClassName:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
  {
    key: 'failed',
    label: 'Échouées',
    badgeLabel: 'échoués',
    color: 'bg-red-500',
    badgeClassName:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  },
] as const;

export type DashboardEnrollmentStatus = (typeof enrollmentStatuses)[number]['key'];

export type FormationProgressDemo = {
  id: string;
  name: string;
  isPublished: boolean;
  /**
   * Durée théorique du parcours, en minutes : le temps attendu d'un étudiant.
   *
   * Les fixtures ne produisent que trois temps passés non nuls — 495, 570 et
   * 650 min. Pour que la colonne « Temps passé » montre ses deux couleurs, le
   * seuil doit tomber strictement entre le plus petit et le plus grand, soit
   * dans l'intervalle ]495 ; 650]. En dehors, toutes les lignes prennent la
   * même couleur et la colonne ne distingue plus rien.
   */
  theoreticalMinutes: number;
  /** Date au-delà de laquelle la formation n'est plus accessible, pour personne. */
  expiresAt: string;
  /** Condition qui fait passer un étudiant en « Terminé ». */
  completionCriterion: string;
} & Record<DashboardEnrollmentStatus, number>;

export const formationProgressDemo: FormationProgressDemo[] = [
  {
    id: 'demo-1',
    name: 'Les fondamentaux du management',
    isPublished: true,
    theoreticalMinutes: 600,
    expiresAt: '2026-12-31T23:59:59.000Z',
    completionCriterion: 'Évaluation finale réussie',
    completed: 30,
    in_progress: 24,
    not_started: 4,
    failed: 2,
  },
  {
    id: 'demo-2',
    name: 'Communiquer avec impact',
    isPublished: true,
    theoreticalMinutes: 540,
    expiresAt: '2026-10-15T23:59:59.000Z',
    completionCriterion: 'Tous les modules consultés',
    completed: 20,
    in_progress: 24,
    not_started: 4,
    failed: 2,
  },
  {
    id: 'demo-3',
    name: 'Piloter un projet digital',
    isPublished: true,
    theoreticalMinutes: 630,
    expiresAt: '2027-06-30T23:59:59.000Z',
    completionCriterion: 'Évaluation finale réussie',
    completed: 16,
    in_progress: 17,
    not_started: 5,
    failed: 2,
  },
  {
    id: 'demo-4',
    name: 'Prévenir les risques professionnels',
    isPublished: false,
    theoreticalMinutes: 510,
    // Volontairement courte : c'est la seule formation dont l'expiration tombe
    // avant l'échéance de certains étudiants, donc la seule qui exerce le
    // plafonnement de la date de fin d'accès.
    expiresAt: '2026-09-20T23:59:59.000Z',
    completionCriterion: 'Temps minimum atteint',
    completed: 6,
    in_progress: 16,
    not_started: 5,
    failed: 3,
  },
];

export const demoProgress = {
  students: 120,
  averageProgress: 64,
  enrollments: enrollmentStatuses.map((status) => ({
    ...status,
    count: formationProgressDemo.reduce((total, formation) => total + formation[status.key], 0),
  })),
};

export function getEnrollmentCount(formation: FormationProgressDemo) {
  return enrollmentStatuses.reduce((total, status) => total + formation[status.key], 0);
}

export function getCompletionRate(formation: FormationProgressDemo) {
  const enrolled = getEnrollmentCount(formation);
  return enrolled ? (formation.completed / enrolled) * 100 : 0;
}

export function getDemoFormationStudents(
  formation: FormationProgressDemo,
  status: DashboardEnrollmentStatus,
) {
  const formationIndex = formationProgressDemo.findIndex((item) => item.id === formation.id);
  if (formationIndex === -1) return [];

  const formationOffset = formationProgressDemo
    .slice(0, formationIndex)
    .reduce((total, item) => total + getEnrollmentCount(item), 0);
  const statusOffset = enrollmentStatuses
    .slice(
      0,
      enrollmentStatuses.findIndex((item) => item.key === status),
    )
    .reduce((total, item) => total + formation[item.key], 0);

  return Array.from({ length: formation[status] }, (_, index) => {
    const studentNumber = ((formationOffset + statusOffset + index) % demoProgress.students) + 1;
    const studentLabel = String(studentNumber).padStart(3, '0');
    return {
      id: `demo-student-${studentNumber}`,
      name: `Étudiant ${studentLabel}`,
      email: `etudiant.${studentLabel}@example.com`,
    };
  });
}

export type FormationRosterEntry = ReturnType<typeof getDemoFormationStudents>[number] & {
  status: DashboardEnrollmentStatus;
};

/**
 * Effectif complet d'une formation, chaque étudiant portant son statut.
 *
 * Les quatre groupes sont disjoints par construction (décalages successifs),
 * donc les concaténer ne produit aucun doublon.
 */
export function getDemoFormationRoster(formation: FormationProgressDemo): FormationRosterEntry[] {
  return enrollmentStatuses.flatMap(({ key }) =>
    getDemoFormationStudents(formation, key).map((student) => ({ ...student, status: key })),
  );
}
