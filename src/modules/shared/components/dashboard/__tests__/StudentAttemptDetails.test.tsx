import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentAttemptDetails } from '../StudentAttemptDetails';
import type {
  AttemptNodeStatus,
  EnrollmentAttemptDetail,
  EnrollmentAttemptNode,
} from '@/shared/types/enrollment-history.types';

const moduleNode: EnrollmentAttemptNode = {
  type: 'module',
  key: 'module-original',
  title: 'Titre figé du module',
  position: 1,
  display_status: 'completed',
  blocked_by: null,
  carried_over_from: null,
  tracked_time_seconds: 3665,
  courses: [
    {
      id: 'course-2',
      title: 'Pratique archivée',
      position: 2,
      status: 'in_progress',
      progress: { total: 3, completed: 1 },
      tracked_time_seconds: 65,
    },
    {
      id: 'course-1',
      title: 'Introduction archivée',
      position: 1,
      status: 'completed',
      progress: { total: 2, completed: 2 },
      tracked_time_seconds: 3600,
    },
    {
      id: 'course-3',
      title: 'Cours non commencé',
      position: 3,
      status: 'not_started',
      progress: { total: 1, completed: 0 },
      tracked_time_seconds: 0,
    },
    {
      id: 'course-4',
      title: 'Cours vide',
      position: 4,
      status: 'no_content',
      progress: { total: 0, completed: 0 },
      tracked_time_seconds: 0,
    },
  ],
  result: null,
  score: null,
  round_number: null,
  attempts_used: null,
  max_attempts: null,
  started_at: null,
  completed_at: null,
  elapsed_seconds: null,
};

const detail: EnrollmentAttemptDetail = {
  attempt: {
    id: 'attempt-1',
    attempt_number: 1,
    status: 'completed',
    available_at: '2026-09-01T09:00:00Z',
    started_at: null,
    ended_at: null,
    interruption_reason: null,
    time_spent_seconds: 3665,
  },
  nodes: [moduleNode],
};

it('déplie au clavier les titres figés, les statuts et les secondes réelles des cours dans leur ordre', async () => {
  const user = userEvent.setup();
  render(<StudentAttemptDetails detail={detail} />);
  const trigger = screen.getByRole('button', {
    name: 'Voir le temps par cours de Titre figé du module',
  });
  expect(trigger).toBeEnabled();
  expect(trigger.querySelector('.lucide-chevron-down')).toBeInTheDocument();
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  const moduleTime = screen.getByText('Temps passé : 1 h 1 min 5 s');
  expect(moduleTime).toBeVisible();
  expect(moduleTime.querySelector('.lucide-timer')).toHaveAttribute('aria-hidden', 'true');
  trigger.focus();
  await user.keyboard('{Enter}');
  const courses = within(
    screen.getByRole('list', { name: 'Temps par cours de Titre figé du module — tentative 1' }),
  ).getAllByRole('listitem');
  expect(courses).toHaveLength(4);
  expect(courses[0]).toHaveTextContent('Introduction archivée');
  expect(courses[0]).toHaveTextContent('1 h');
  expect(courses[1]).toHaveTextContent('1 min 5 s');
  expect(courses[1]).toHaveTextContent('En cours · 1 / 3 contenus terminés');
  expect(courses[2]).toHaveTextContent('Non commencé');
  expect(courses[2]).not.toHaveTextContent(/Temps passé|0 s/);
  expect(courses[3]).toHaveTextContent('Sans contenu');
  expect(courses[3]).not.toHaveTextContent(/Temps passé|0 s/);
  expect(courses[0].parentElement?.parentElement).toHaveClass(
    'mt-3 space-y-3 rounded-sm border p-3',
    { exact: true },
  );
  expect(moduleTime).toBeVisible();
  expect(moduleNode.courses[0].id).toBe('course-2');
  await user.keyboard(' ');
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(trigger).toHaveFocus();
  expect(screen.queryByRole('list', { name: /^Temps par cours/ })).not.toBeInTheDocument();
  expect(moduleTime).toBeVisible();
});

it.each<[AttemptNodeStatus, string]>([
  ['completed', 'Terminé'],
  ['failed', 'Échouée'],
  ['in_progress', 'En cours'],
  ['available', 'Disponible'],
  ['carried_over', 'Acquis conservé'],
  ['to_redo', 'À refaire'],
  ['locked', 'Verrouillé'],
  ['skipped', 'Ignoré'],
  ['not_reached', 'Non atteint'],
])('affiche fidèlement le statut %s sans le convertir en verrouillage', (status, label) => {
  render(
    <StudentAttemptDetails
      detail={{ ...detail, nodes: [{ ...moduleNode, display_status: status }] }}
    />,
  );
  expect(screen.getByText(label, { exact: true })).toBeInTheDocument();
  if (status === 'completed' || status === 'failed' || status === 'in_progress') {
    expect(screen.getByText('Temps passé : 1 h 1 min 5 s')).toBeVisible();
  } else {
    expect(screen.queryByText(/Temps passé :/)).not.toBeInTheDocument();
    expect(screen.getByRole('listitem').querySelector('.lucide-timer')).not.toBeInTheDocument();
  }
  if (status !== 'locked') expect(screen.queryByText('Verrouillé')).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Début :|Fin :|Bloqué par :|Reprise du parcours/),
  ).not.toBeInTheDocument();
});

it.each<AttemptNodeStatus>([
  'failed',
  'in_progress',
  'available',
  'carried_over',
  'to_redo',
  'locked',
  'skipped',
  'not_reached',
])('masque le chevron et empêche le dépliage du module au statut %s', async (status) => {
  const user = userEvent.setup();
  render(
    <StudentAttemptDetails
      detail={{ ...detail, nodes: [{ ...moduleNode, display_status: status }] }}
    />,
  );
  const trigger = screen.getByRole('button', { name: /Voir le temps par cours/ });
  expect(trigger).toBeDisabled();
  expect(trigger.querySelector('.lucide-chevron-down')).not.toBeInTheDocument();
  await user.click(trigger);
  expect(screen.queryByRole('list', { name: /^Temps par cours/ })).not.toBeInTheDocument();
});

it('affiche zéro seconde avec le chrono sans recalculer le temps depuis les cours ou les dates', () => {
  render(
    <StudentAttemptDetails
      detail={{
        ...detail,
        nodes: [
          {
            ...moduleNode,
            tracked_time_seconds: 0,
            started_at: '2026-09-02T09:00:00Z',
            completed_at: '2026-09-03T09:00:00Z',
          },
        ],
      }}
    />,
  );
  const moduleTime = screen.getByText('Temps passé : 0 s');
  expect(moduleTime).toBeVisible();
  expect(moduleTime.querySelector('.lucide-timer')).toBeInTheDocument();
});

it.each([
  'in_progress',
  'to_redo',
  'carried_over',
  'locked',
  'available',
  'skipped',
  'not_reached',
] as const)('retire le détail déjà ouvert lorsque le module passe au statut %s', async (status) => {
  const user = userEvent.setup();
  const { rerender } = render(<StudentAttemptDetails detail={detail} />);
  await user.click(screen.getByRole('button', { name: /Voir le temps par cours/ }));
  expect(screen.getByRole('list', { name: /^Temps par cours/ })).toBeInTheDocument();
  rerender(
    <StudentAttemptDetails
      detail={{ ...detail, nodes: [{ ...moduleNode, display_status: status }] }}
    />,
  );
  expect(screen.getByRole('button', { name: /Voir le temps par cours/ })).toBeDisabled();
  expect(screen.queryByRole('list', { name: /^Temps par cours/ })).not.toBeInTheDocument();
  if (status !== 'in_progress') {
    expect(screen.queryByText(/Temps passé :/)).not.toBeInTheDocument();
  }
});

it('conserve les statuts sans afficher la provenance des acquis ni le titre bloquant', () => {
  render(
    <StudentAttemptDetails
      detail={{
        ...detail,
        nodes: [
          {
            ...moduleNode,
            display_status: 'carried_over',
            carried_over_from: { execution_id: 'exec-1', attempt_number: 2 },
          },
          {
            ...moduleNode,
            key: 'blocked',
            title: 'Module suivant',
            position: 2,
            display_status: 'not_reached',
            blocked_by: { type: 'evaluation', key: 'exam', title: 'Certification historique' },
          },
        ],
      }}
    />,
  );
  expect(screen.getByText('Acquis conservé', { exact: true })).toBeInTheDocument();
  expect(screen.getByText('Non atteint', { exact: true })).toBeInTheDocument();
  expect(screen.queryByText(/Acquis conservé depuis|Bloqué par/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Reprise du parcours|Échec à/)).not.toBeInTheDocument();
});

it.each<AttemptNodeStatus>([
  'locked',
  'available',
  'in_progress',
  'completed',
  'failed',
  'carried_over',
  'to_redo',
  'skipped',
  'not_reached',
])('affiche l’évaluation sans dépliage et conserve le grisage selon son statut : %s', (status) => {
  render(
    <StudentAttemptDetails
      detail={{
        ...detail,
        nodes: [
          {
            ...moduleNode,
            type: 'evaluation',
            title: 'Évaluation finale',
            display_status: status,
            courses: [],
          },
        ],
      }}
    />,
  );
  const title = screen.getByText('Évaluation finale');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(title.querySelector('.lucide-chevron-down')).not.toBeInTheDocument();
  expect(title).not.toHaveAttribute('aria-expanded');
  if (status === 'locked') {
    expect(screen.getByText('Verrouillé')).toHaveClass('text-muted-foreground');
  }
  if (status === 'completed' || status === 'failed') {
    expect(title).not.toHaveClass('text-muted-foreground');
    expect(screen.getByText('Score : —')).toBeVisible();
    expect(screen.getByText('Tentative : —/—')).toBeVisible();
  } else {
    expect(title).toHaveClass('text-muted-foreground');
    expect(screen.queryByText(/Score :|Tentative :/)).not.toBeInTheDocument();
  }
  if (status === 'completed' || status === 'failed' || status === 'in_progress') {
    expect(screen.getByText('Temps passé : —')).toBeVisible();
    expect(screen.getByText('Temps passé : —').querySelector('.lucide-timer')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  } else {
    expect(screen.queryByText(/Temps passé :/)).not.toBeInTheDocument();
    expect(screen.getByRole('listitem').querySelector('.lucide-timer')).not.toBeInTheDocument();
  }
});

it.each([
  [0, '0 s'],
  [65, '1 min 5 s'],
  [null, '—'],
] as const)(
  'affiche le temps API %s d’une évaluation en cours sans anticiper ses résultats',
  (seconds, duration) => {
    render(
      <StudentAttemptDetails
        detail={{
          ...detail,
          nodes: [
            {
              ...moduleNode,
              type: 'evaluation',
              display_status: 'in_progress',
              elapsed_seconds: seconds,
              started_at: '2026-09-01T09:00:00Z',
              score: 80,
              attempts_used: 1,
              max_attempts: 3,
              courses: [],
            },
          ],
        }}
      />,
    );
    const time = screen.getByText(`Temps passé : ${duration}`);
    expect(time).toBeVisible();
    expect(time.querySelector('.lucide-timer')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByText(/Score :|Tentative :/)).not.toBeInTheDocument();
  },
);

it.each([
  ['failed', 0, '0 s', 0, 'Échouée', 0],
  ['completed', 3665, '1 h 1 min 5 s', 87.5, 'Réussie', 2],
] as const)(
  'affiche directement le temps passé, le score et le compteur de tentatives d’une évaluation %s',
  async (status, seconds, duration, score, label, attemptsUsed) => {
    const user = userEvent.setup();
    render(
      <StudentAttemptDetails
        detail={{
          ...detail,
          nodes: [
            {
              ...moduleNode,
              type: 'evaluation',
              courses: [],
              title: 'Évaluation archivée',
              display_status: status,
              result: status === 'completed' ? 'passed' : 'failed',
              score,
              attempts_used: attemptsUsed,
              max_attempts: 3,
              round_number: 1,
              elapsed_seconds: seconds,
              started_at: '2026-09-02T09:00:00Z',
              completed_at: '2026-09-03T09:00:00Z',
              blocked_by: { type: 'module', key: 'previous', title: 'Module précédent' },
              carried_over_from: { execution_id: 'exec-1', attempt_number: 2 },
              tracked_time_seconds: 0,
            },
          ],
        }}
      />,
    );
    expect(screen.getByText('Évaluation archivée')).toBeInTheDocument();
    expect(screen.getByText(label, { exact: true })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(`Temps passé : ${duration}`)).toBeVisible();
    expect(
      screen.getByText(`Temps passé : ${duration}`).querySelector('.lucide-timer'),
    ).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText(`Score : ${score} %`)).toBeVisible();
    expect(screen.getByText(`Tentative : ${attemptsUsed}/3`)).toBeVisible();
    expect(screen.getByText(`Temps passé : ${duration}`).parentElement?.parentElement).toHaveClass(
      'space-y-3 rounded-sm pl-3',
      { exact: true },
    );
    expect(
      screen.queryByText(
        /Résultat :|Session :|Essais utilisés :|Durée de l’évaluation :|Bloqué par :|Acquis conservé depuis/,
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Début :|Fin :/)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Aucun détail par cours disponible pour ce module.'),
    ).not.toBeInTheDocument();
    await user.click(screen.getByText('Évaluation archivée'));
    expect(screen.getByText(`Temps passé : ${duration}`)).toBeVisible();
    expect(screen.getByText(`Score : ${score} %`)).toBeVisible();
    expect(screen.getByText(`Tentative : ${attemptsUsed}/3`)).toBeVisible();
  },
);

it('n’invente ni temps, ni score, ni tentatives lorsque les données de l’évaluation sont absentes', () => {
  const { container } = render(
    <StudentAttemptDetails
      detail={{
        ...detail,
        nodes: [
          {
            ...moduleNode,
            type: 'evaluation',
            started_at: '2026-09-02T09:00:00Z',
            completed_at: '2026-09-03T09:00:00Z',
          },
        ],
      }}
    />,
  );
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.getByText('Temps passé : —')).toBeInTheDocument();
  expect(screen.getByText('Score : —')).toBeInTheDocument();
  expect(screen.getByText('Tentative : —/—')).toBeInTheDocument();
  expect(
    screen.queryByText(/Résultat :|Session :|Essais utilisés :|Début :|Fin :/),
  ).not.toBeInTheDocument();
  expect(container.querySelector('time')).not.toBeInTheDocument();
});

it('conserve les dates reçues pour les modules', () => {
  const { container } = render(
    <StudentAttemptDetails
      detail={{
        ...detail,
        nodes: [
          {
            ...moduleNode,
            started_at: '2026-09-02T09:00:00Z',
            completed_at: '2026-09-03T09:00:00Z',
          },
        ],
      }}
    />,
  );
  expect([...container.querySelectorAll('time')].map((time) => time.dateTime)).toEqual([
    '2026-09-02T09:00:00Z',
    '2026-09-03T09:00:00Z',
  ]);
});

it('réinitialise les modules ouverts entre deux tentatives sans conserver leurs durées', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<StudentAttemptDetails detail={detail} />);
  await user.click(screen.getByRole('button', { name: /Voir le temps par cours/ }));
  rerender(
    <StudentAttemptDetails
      detail={{
        ...detail,
        attempt: { ...detail.attempt, id: 'attempt-2', attempt_number: 2 },
        nodes: [{ ...moduleNode, tracked_time_seconds: 8, courses: [] }],
      }}
    />,
  );
  expect(screen.getByRole('button', { name: /Voir le temps par cours/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  expect(screen.queryByText('Introduction archivée')).not.toBeInTheDocument();
  expect(screen.queryByText('Temps passé : 1 h 1 min 5 s')).not.toBeInTheDocument();
  expect(screen.getByText('Temps passé : 8 s')).toBeVisible();
  await user.click(screen.getByRole('button', { name: /Voir le temps par cours/ }));
  expect(screen.getByText('Aucun détail par cours disponible pour ce module.')).toBeInTheDocument();
});

it('affiche les étapes vides sans en générer', () => {
  render(<StudentAttemptDetails detail={{ ...detail, nodes: [] }} />);
  expect(screen.getByText('Aucune étape disponible pour cette tentative.')).toBeInTheDocument();
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
});
