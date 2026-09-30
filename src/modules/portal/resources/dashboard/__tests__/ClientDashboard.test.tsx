import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { enrollmentHistoryApi } from '@/shared/api/enrollment-history.api';
import type {
  EnrollmentAttemptDetailResponse,
  EnrollmentAttemptSummary,
} from '@/shared/types/enrollment-history.types';
import ClientDashboard from '../ClientDashboard';
import { clientDashboardApi } from '../api';
import type { ApiClientDashboardStudent } from '../types';

// Recharts needs a measured container in jsdom; keep the chart's accessible outer value real.
jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ className }: { className?: string }) => (
    <div data-slot="chart" className={className} />
  ),
}));
jest.mock('@/shared/api/enrollment-history.api', () => ({
  enrollmentHistoryApi: { history: jest.fn(), detail: jest.fn() },
}));
// Keep the real date filters and their draft/apply/reset interactions.
jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (range: DateRange | undefined) => void }) => (
    <div>
      <button onClick={() => onSelect({ from: new Date(2026, 8, 2), to: new Date(2026, 8, 28) })}>
        Choisir une plage
      </button>
      <button onClick={() => onSelect({ from: new Date(2026, 8, 2) })}>
        Choisir la borne inférieure
      </button>
      <button onClick={() => onSelect({ from: undefined, to: new Date(2026, 8, 28) })}>
        Choisir la borne supérieure
      </button>
      <button onClick={() => onSelect({ from: new Date(2026, 8, 2), to: new Date(2026, 8, 2) })}>
        Choisir un seul jour
      </button>
    </div>
  ),
}));

const api = {
  overview: jest.spyOn(clientDashboardApi, 'overview'),
  students: jest.spyOn(clientDashboardApi, 'students'),
};
const row: ApiClientDashboardStudent = {
  id: 'enrollment-1',
  learner: {
    id: 'learner-1',
    first_name: 'Alice',
    last_name: 'Martin',
    email: 'alice@example.com',
  },
  learning_path: { id: 'path-1', name: 'Formation réelle' },
  status: 'in_progress',
  progress_percent: 40,
  enrolled_at: '2026-09-01T10:00:00.000Z',
  started_at: '2026-09-02T10:00:00.000Z',
  completed_at: null,
  ended_at: null,
  expires_at: '2026-12-31T23:59:59.000Z',
};
const historyApi = jest.mocked(enrollmentHistoryApi);
const attempt: EnrollmentAttemptSummary = {
  id: 'attempt-real',
  attempt_number: 1,
  status: 'failed',
  available_at: '2026-09-01T10:00:00Z',
  started_at: '2026-09-02T10:00:00Z',
  ended_at: '2026-09-02T11:00:00Z',
  time_spent_seconds: 125,
  interruption_reason: null,
};
const attemptDetail: EnrollmentAttemptDetailResponse = {
  data: {
    attempt,
    nodes: [
      {
        type: 'module',
        key: 'module-real',
        title: 'Module historique',
        position: 1,
        display_status: 'completed',
        blocked_by: null,
        carried_over_from: null,
        tracked_time_seconds: 64,
        courses: [
          {
            id: 'course-real',
            title: 'Cours historique',
            position: 1,
            status: 'completed',
            progress: { total: 1, completed: 1 },
            tracked_time_seconds: 64,
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
      },
      {
        type: 'evaluation',
        key: 'evaluation-real',
        title: 'Évaluation historique',
        position: 2,
        display_status: 'failed',
        blocked_by: null,
        carried_over_from: null,
        tracked_time_seconds: 61,
        courses: [],
        result: 'failed',
        score: 0,
        round_number: 1,
        attempts_used: 1,
        max_attempts: 1,
        started_at: attempt.started_at,
        completed_at: attempt.ended_at,
        elapsed_seconds: 61,
      },
    ],
  },
};
const clients: QueryClient[] = [];

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <ClientDashboard />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: {
      id: 'manager-1',
      name: 'Manager',
      email: 'manager@example.com',
      role: Role.CLIENT_MANAGER,
    },
    role: Role.CLIENT_MANAGER,
    sessionId: 'session-1',
  });
  useTenantStore.setState({ tenant: null, resolutionStatus: 'resolved' });
  api.overview.mockResolvedValue({
    data: {
      learning_paths: 12,
      enrollments: {
        completed: 65,
        in_progress: 19,
        not_started: 7,
        failed: 0,
        expired: 0,
        total: 91,
      },
    },
  });
  api.students.mockResolvedValue({ data: [row], meta: { total: 1, page: 1, per_page: 100 } });
  historyApi.history.mockReset().mockImplementation(async (enrollmentId, page = 1) => ({
    data: {
      enrollment: {
        id: enrollmentId,
        learner_id: row.learner.id,
        learning_path_id: row.learning_path.id,
        status: row.status,
      },
      attempts: [attempt],
    },
    meta: { total: 1, page, per_page: 20 },
  }));
  historyApi.detail.mockReset().mockResolvedValue(attemptDetail);
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  useAuthStore.setState({ user: null, role: null, sessionId: null });
  useTenantStore.setState({ tenant: null, resolutionStatus: 'resolved' });
});

it('garde les quatre cartes et la table mais remplace leurs données de démonstration', async () => {
  renderDashboard();
  expect(await screen.findByText('Alice Martin')).toBeInTheDocument();
  for (const value of ['12', '65', '19', '7']) expect(screen.getByText(value)).toBeInTheDocument();
  expect(screen.getByText('Formation réelle')).toBeInTheDocument();
  expect(screen.getByText('40%')).toBeInTheDocument();
  // Vient de la synthèse (65/91), pas de l'unique ligne d'étudiant chargée (qui serait à 0 %).
  expect(screen.getByRole('img', { name: 'Progression globale : 71%' })).toBeInTheDocument();
  expect(screen.queryByText('Amélie Laurent')).not.toBeInTheDocument();
  expect(screen.queryByText('January - June 2024')).not.toBeInTheDocument();
  const detail = screen.getByRole('button', { name: 'Voir le détail de Alice Martin' });
  expect(detail).toBeEnabled();
  expect(detail).toHaveAttribute('aria-haspopup', 'dialog');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(historyApi.history).not.toHaveBeenCalled();
  expect(historyApi.detail).not.toHaveBeenCalled();
});

it('affiche le début et la fin réels de l’API, y compris une fin en échec, et renomme la validité de l’accès', async () => {
  api.students.mockResolvedValue({
    data: [{ ...row, status: 'failed', ended_at: '2026-09-28T23:59:59.000Z' }],
    meta: { total: 1, page: 1, per_page: 100 },
  });
  renderDashboard();
  await screen.findByText('Alice Martin');
  expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
    'Étudiant',
    'Parcours',
    'Statut',
    'Début',
    'Fin',
    'Accès valable jusqu’au',
    'Progression',
    ' ',
  ]);
  const cells = within(screen.getByRole('row', { name: /Alice Martin/ })).getAllByRole('cell');
  expect(cells[2]).toHaveTextContent('Échoué');
  expect(cells[3]).toHaveTextContent('02/09/2026');
  expect(cells[3].querySelector('time')).toHaveAttribute('datetime', row.started_at);
  expect(cells[4]).toHaveTextContent('28/09/2026');
  expect(cells[4].querySelector('time')).toHaveAttribute('datetime', '2026-09-28T23:59:59.000Z');
  expect(cells[5]).toHaveTextContent('31/12/2026');
  expect(screen.queryByText('Échéance')).not.toBeInTheDocument();
});

it('ne remplace pas les dates absentes par l’inscription, la progression ou l’expiration', async () => {
  api.students.mockResolvedValue({
    data: [{ ...row, status: 'expired', progress_percent: 100, started_at: null, ended_at: null }],
    meta: { total: 1, page: 1, per_page: 100 },
  });
  renderDashboard();
  await screen.findByText('Alice Martin');
  const cells = within(screen.getByRole('row', { name: /Alice Martin/ })).getAllByRole('cell');
  expect(cells[3]).toHaveTextContent(/^—$/);
  expect(cells[4]).toHaveTextContent(/^—$/);
});

describe.each([
  ['Début', 'started_at'],
  ['Fin', 'ended_at'],
  ['Accès valable jusqu’au', 'expires_at'],
] as const)('filtre de date %s', (label, field) => {
  it.each([
    ['une plage', [1, 2]],
    ['la borne inférieure', [1, 2, 3]],
    ['la borne supérieure', [0, 1, 2]],
    ['un seul jour', [1]],
  ] as const)(
    'applique %s avec bornes inclusives sur toutes les pages et exclut les dates absentes',
    async (choice, expected) => {
      const dates = [
        '2026-09-01T23:59:59.000Z',
        '2026-09-02T00:00:00.000Z',
        '2026-09-28T23:59:59.999Z',
        '2026-09-29T00:00:00.000Z',
        null,
      ];
      api.students.mockImplementation(async (page = 1) => ({
        data: [
          {
            ...row,
            id: `enrollment-${page}`,
            learner: { ...row.learner, first_name: `Étudiant ${page - 1}` },
            enrolled_at: '2025-01-01T00:00:00Z',
            [field]: dates[page - 1],
          },
        ],
        meta: { total: dates.length, page, per_page: 1 },
      }));
      const user = userEvent.setup();
      renderDashboard();
      await screen.findByText('Étudiant 4 Martin');
      await user.click(screen.getByRole('button', { name: `Filtrer par ${label}` }));
      await user.click(screen.getByRole('button', { name: `Choisir ${choice}` }));
      expect(screen.getAllByRole('row', { name: /Étudiant \d Martin/ })).toHaveLength(5);
      await user.click(screen.getByRole('button', { name: 'Appliquer' }));
      expect(screen.getAllByRole('row', { name: /Étudiant \d Martin/ })).toHaveLength(
        expected.length,
      );
      expected.forEach((index) =>
        expect(screen.getByText(`Étudiant ${index} Martin`)).toBeInTheDocument(),
      );
      expect(screen.queryByText('Étudiant 4 Martin')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: `Filtrer par ${label} — filtre actif` }),
      ).toBeInTheDocument();
      expect(api.students).toHaveBeenCalledTimes(5);
      await user.click(screen.getByRole('button', { name: `Filtrer par ${label} — filtre actif` }));
      await user.click(screen.getByRole('button', { name: 'Réinitialiser' }));
      expect(screen.getAllByRole('row', { name: /Étudiant \d Martin/ })).toHaveLength(5);
    },
  );
});

it('combine les trois dates avec la recherche et le parcours, puis réinitialise les filtres', async () => {
  api.students.mockResolvedValue({
    data: [
      { ...row, ended_at: '2026-09-28T12:00:00Z', expires_at: '2026-09-28T23:59:59Z' },
      { ...row, id: 'enrollment-2', learning_path: { id: 'path-2', name: 'Autre parcours' } },
    ],
    meta: { total: 2, page: 1, per_page: 100 },
  });
  const user = userEvent.setup();
  renderDashboard();
  await screen.findByText('Autre parcours');
  const studentCard = within(screen.getByRole('table').closest<HTMLElement>('[data-slot="card"]')!);
  await user.type(screen.getByRole('textbox', { name: 'Rechercher un étudiant' }), 'Alice');
  await user.click(studentCard.getByRole('combobox', { name: 'Filtrer par parcours' }));
  await user.click(screen.getByRole('option', { name: 'Formation réelle' }));
  for (const label of ['Début', 'Fin', 'Accès valable jusqu’au']) {
    await user.click(screen.getByRole('button', { name: `Filtrer par ${label}` }));
    await user.click(screen.getByRole('button', { name: 'Choisir une plage' }));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));
  }
  expect(screen.getAllByRole('row', { name: /Alice Martin/ })).toHaveLength(1);
  expect(studentCard.getByRole('status')).toHaveTextContent(
    '3 filtres de dates actifs · 1 sur 2 inscriptions',
  );
  await user.clear(screen.getByRole('textbox', { name: 'Rechercher un étudiant' }));
  await user.type(screen.getByRole('textbox', { name: 'Rechercher un étudiant' }), 'Absent');
  expect(screen.getByText('Aucun étudiant trouvé').closest('td')).toHaveAttribute('colspan', '8');
  await user.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
  expect(screen.getAllByRole('row', { name: /Alice Martin/ })).toHaveLength(2);
  expect(screen.getByRole('textbox', { name: 'Rechercher un étudiant' })).toHaveValue('');
  expect(studentCard.getByRole('combobox', { name: 'Filtrer par parcours' })).toHaveTextContent(
    'Tous les parcours',
  );
  expect(screen.queryByRole('button', { name: /filtre actif/ })).not.toBeInTheDocument();
});

it('garde les statistiques en grille 2×2 et place la progression dessous uniquement sur mobile', async () => {
  renderDashboard();
  await screen.findByText('65');
  const progressCard = screen.getByText('Progression globale').closest('[data-slot="card"]');
  const grid = progressCard?.parentElement;
  expect(grid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4', 'md:grid-rows-2');
  expect(progressCard).toHaveClass(
    'min-w-0',
    'col-span-2',
    'col-start-1',
    'row-start-3',
    'md:col-start-3',
    'md:row-start-1',
    'md:row-span-2',
  );
  for (const [description, column, row] of [
    ['Nombre de parcours suivis', 1, 1],
    ['Inscriptions terminées', 2, 1],
    ['Inscriptions en cours', 1, 2],
    ['Inscriptions non commencées', 2, 2],
  ] as const) {
    const card = screen.getByText(description).closest('[data-slot="card"]');
    expect(card?.parentElement).toBe(grid);
    expect(card).toHaveClass('min-w-0', `col-start-${column}`, `row-start-${row}`);
    expect(card?.querySelector('[data-slot="card-content"]')).toHaveClass('min-h-28', 'flex-1');
  }
  const header = progressCard?.querySelector('[data-slot="card-header"]');
  expect(header).toHaveClass('flex-wrap');
  expect(progressCard?.querySelector('[data-slot="chart"]')).toHaveClass(
    'aspect-square',
    'w-full',
    'max-w-56',
  );
  expect(within(progressCard as HTMLElement).getByRole('combobox')).toHaveClass(
    'max-w-full',
    'min-w-0',
  );
});

it.each([
  ['Nombre de parcours suivis', false],
  ['Inscriptions terminées', true],
  ['Inscriptions en cours', false],
  ['Inscriptions non commencées', false],
] as const)('ajoute le motif de fond décoratif à la carte %s', async (description, highlighted) => {
  renderDashboard();
  await screen.findByText('65');
  const card = screen.getByText(description).closest('[data-slot="card"]');
  const decoration = card?.querySelector('span[aria-hidden="true"]');
  expect(card).toHaveClass('relative', 'isolate', 'overflow-hidden');
  expect(decoration).toHaveClass('pointer-events-none', 'absolute', 'size-28', '-rotate-12');
  expect(decoration).toHaveClass(highlighted ? 'text-(--color-primary)/20' : 'text-slate-300/40');
  expect(decoration?.children).toHaveLength(3);
  expect(card?.querySelector('svg')).not.toBeInTheDocument();
  expect(card?.querySelector('[data-slot="card-content"]')).toHaveClass('relative', 'z-10');
});

it('charge toutes les pages pour permettre la recherche sur toutes les lignes, sans attendre les étudiants pour la progression globale', async () => {
  api.overview.mockResolvedValue({
    data: {
      learning_paths: 2,
      enrollments: {
        completed: 1,
        in_progress: 1,
        not_started: 2,
        failed: 0,
        expired: 0,
        total: 4,
      },
    },
  });
  api.students.mockImplementation(async (page = 1) => ({
    data: [
      {
        ...row,
        id: `enrollment-${page}`,
        learner: { ...row.learner, first_name: page === 1 ? 'Alice' : 'Béatrice' },
        status: page === 1 ? 'in_progress' : 'completed',
        progress_percent: page === 1 ? 40 : 100,
      },
    ],
    meta: { total: 2, page, per_page: 1 },
  }));
  renderDashboard();
  // 25 % vient de la synthèse (1/4), pas des deux lignes chargées (qui donneraient 50 %).
  expect(await screen.findByRole('img', { name: 'Progression globale : 25%' })).toBeInTheDocument();
  expect(await screen.findByText('Béatrice Martin')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Rechercher un étudiant' }), {
    target: { value: '  Béatrice  ' },
  });
  expect(screen.queryByText('Alice Martin')).not.toBeInTheDocument();
  expect(screen.getByText('Béatrice Martin')).toBeInTheDocument();
  expect(api.students).toHaveBeenCalledTimes(2);
});

it('affiche la progression globale dès la synthèse, avant même que les étudiants aient fini de charger', async () => {
  api.overview.mockResolvedValue({
    data: {
      learning_paths: 2,
      enrollments: {
        completed: 1,
        in_progress: 1,
        not_started: 2,
        failed: 0,
        expired: 0,
        total: 4,
      },
    },
  });
  let resolveStudents!: (value: Awaited<ReturnType<typeof clientDashboardApi.students>>) => void;
  api.students.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveStudents = resolve;
      }),
  );
  renderDashboard();
  expect(await screen.findByRole('img', { name: 'Progression globale : 25%' })).toBeInTheDocument();
  resolveStudents({ data: [row], meta: { total: 1, page: 1, per_page: 100 } });
  expect(await screen.findByText('Alice Martin')).toBeInTheDocument();
});

it('calcule terminé / total par inscription et par parcours, sans moyenner les progressions', async () => {
  const statuses = ['completed', 'in_progress', 'not_started', 'failed', 'expired'] as const;
  api.overview.mockResolvedValue({
    data: {
      learning_paths: 2,
      enrollments: {
        completed: 1,
        in_progress: 1,
        not_started: 1,
        failed: 1,
        expired: 1,
        total: 5,
      },
    },
  });
  api.students.mockResolvedValue({
    data: statuses.map((status, index) => ({
      ...row,
      id: 'enrollment-' + index,
      status,
      progress_percent: 100,
      learning_path: index < 2 ? row.learning_path : { id: 'path-2', name: 'Autre parcours' },
    })),
    meta: { total: 5, page: 1, per_page: 100 },
  });
  const user = userEvent.setup();
  renderDashboard();
  expect(await screen.findByRole('img', { name: 'Progression globale : 20%' })).toBeInTheDocument();
  const card = within(
    screen.getByText('Progression globale').closest('[data-slot="card"]') as HTMLElement,
  );
  await user.click(card.getByRole('combobox', { name: 'Filtrer par parcours' }));
  await user.click(screen.getByRole('option', { name: 'Formation réelle' }));
  expect(screen.getByRole('img', { name: 'Progression globale : 50%' })).toBeInTheDocument();
  await user.click(card.getByRole('combobox', { name: 'Filtrer par parcours' }));
  await user.click(screen.getByRole('option', { name: 'Autre parcours' }));
  expect(screen.getByRole('img', { name: 'Progression globale : 0%' })).toBeInTheDocument();
  await user.click(card.getByRole('combobox', { name: 'Filtrer par parcours' }));
  await user.click(screen.getByRole('option', { name: 'Tous les parcours' }));
  expect(screen.getByRole('img', { name: 'Progression globale : 20%' })).toBeInTheDocument();
});

it('ne montre aucun nombre fictif pendant le chargement', () => {
  api.overview.mockReturnValue(new Promise(() => {}));
  api.students.mockReturnValue(new Promise(() => {}));
  renderDashboard();
  const table = within(screen.getByRole('table'));
  expect(table.getAllByRole('columnheader')).toHaveLength(8);
  const skeletonRows = table.getAllByRole('row').slice(1);
  expect(skeletonRows).toHaveLength(5);
  for (const skeletonRow of skeletonRows) {
    expect(within(skeletonRow).getAllByRole('cell')).toHaveLength(8);
  }
  expect(screen.queryByText('86')).not.toBeInTheDocument();
  expect(screen.queryByText('Aucun étudiant trouvé')).not.toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Progression globale : indisponible' }),
  ).toBeInTheDocument();
});

it('affiche une erreur de liste et permet de réessayer sans perdre les KPI', async () => {
  api.students.mockRejectedValueOnce(new Error('erreur réseau'));
  renderDashboard();
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger les étudiants');
  expect(screen.getByText('Les étudiants sont indisponibles.')).toHaveAttribute('colspan', '8');
  expect(screen.getByText('65')).toBeInTheDocument();
  expect(screen.queryByText('Aucun étudiant trouvé')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
  expect(await screen.findByText('Alice Martin')).toBeInTheDocument();
});

it('gère une synthèse en erreur et une liste vide sans données de secours', async () => {
  api.overview.mockRejectedValueOnce(new Error('erreur réseau'));
  api.students.mockResolvedValue({ data: [], meta: { total: 0, page: 1, per_page: 100 } });
  renderDashboard();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Impossible de charger les indicateurs',
  );
  expect(screen.getByText('Aucun étudiant trouvé')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Progression globale : 0%' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
  expect(await screen.findByText('65')).toBeInTheDocument();
});

it('affiche un message unique quand les indicateurs et les étudiants échouent ensemble', async () => {
  api.overview.mockRejectedValueOnce(new Error('erreur réseau'));
  api.students.mockRejectedValueOnce(new Error('erreur réseau'));
  renderDashboard();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Impossible de charger le tableau de bord.',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
  expect(await screen.findByText('Alice Martin')).toBeInTheDocument();
  expect(screen.getByText('65')).toBeInTheDocument();
});

it('retire les données précédentes lors du changement de session', async () => {
  renderDashboard();
  await screen.findByText('Alice Martin');
  api.students.mockReturnValue(new Promise(() => {}));
  api.overview.mockReturnValue(new Promise(() => {}));
  act(() => useAuthStore.setState({ sessionId: 'session-2' }));
  expect(screen.queryByText('Alice Martin')).not.toBeInTheDocument();
  expect(screen.queryByText('65')).not.toBeInTheDocument();
  await waitFor(() => expect(api.students).toHaveBeenCalledTimes(2));
});

it('ne lance aucune requête pour un rôle non gestionnaire', () => {
  useAuthStore.setState({ role: Role.TRAINEE });
  renderDashboard();
  expect(api.students).not.toHaveBeenCalled();
  expect(api.overview).not.toHaveBeenCalled();
});

it.each(['démontage', 'session'] as const)(
  'annule les requêtes client en attente au changement de %s',
  async (change) => {
    api.overview.mockReturnValue(new Promise(() => {}));
    api.students.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderDashboard();
    await waitFor(() => expect(api.students).toHaveBeenCalledTimes(1));
    const signals = [api.overview.mock.calls[0][0], api.students.mock.calls[0][1]];
    for (const signal of signals) {
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal?.aborted).toBe(false);
    }
    if (change === 'session') act(() => useAuthStore.setState({ sessionId: 'session-2' }));
    else unmount();
    for (const signal of signals) expect(signal?.aborted).toBe(true);
    if (change === 'session') {
      await waitFor(() => expect(api.students).toHaveBeenCalledTimes(2));
      expect(api.students.mock.calls[1][1]?.aborted).toBe(false);
      expect(api.overview.mock.calls[1][0]?.aborted).toBe(false);
    }
  },
);

it.each([
  ['not_started', 'Non commencé'],
  ['in_progress', 'En cours'],
  ['completed', 'Terminé'],
  ['expired', 'Expiré'],
  ['failed', 'Échoué'],
] as const)(
  'affiche le statut API %s dans sa colonne avant Début même à 100 %%',
  async (status, label) => {
    api.students.mockResolvedValue({
      data: [{ ...row, status, progress_percent: 100, expires_at: null }],
      meta: { total: 1, page: 1, per_page: 100 },
    });
    renderDashboard();
    await screen.findByText('Alice Martin');
    expect(screen.getByRole('columnheader', { name: 'Statut' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(8);
    const studentRow = screen.getByRole('row', { name: /Alice Martin/ });
    const cells = within(studentRow).getAllByRole('cell');
    expect(cells).toHaveLength(8);
    expect(cells[2]).toHaveTextContent(label);
    expect(cells[5]).toHaveTextContent('Sans échéance');
    expect(cells[5]).not.toHaveTextContent(label);
    if (status !== 'completed') {
      expect(within(studentRow).queryByText('Terminé')).not.toBeInTheDocument();
    }
    expect(within(studentRow).getByRole('button')).toBeEnabled();
  },
);

it.each(['not_started', 'in_progress', 'expired', 'failed'] as const)(
  'ne remplace pas le statut %s par Terminé quand la progression atteint 100 %%',
  async (status) => {
    api.students.mockResolvedValue({
      data: [{ ...row, status, progress_percent: 100, expires_at: '2000-01-01T00:00:00Z' }],
      meta: { total: 1, page: 1, per_page: 100 },
    });
    renderDashboard();
    await screen.findByText('Alice Martin');
    const studentRow = screen.getByRole('row', { name: /Alice Martin/ });
    const deadlineCell = within(studentRow).getAllByRole('cell')[5];
    expect(within(deadlineCell).getByText('En retard')).toBeInTheDocument();
    expect(within(studentRow).queryByText('Terminé')).not.toBeInTheDocument();
  },
);

it('affiche Terminé une seule fois selon le statut API sans alerte de retard contradictoire', async () => {
  api.students.mockResolvedValue({
    data: [{ ...row, status: 'completed', expires_at: '2000-01-01T00:00:00Z' }],
    meta: { total: 1, page: 1, per_page: 100 },
  });
  renderDashboard();
  await screen.findByText('Alice Martin');
  const studentRow = screen.getByRole('row', { name: /Alice Martin/ });
  expect(within(studentRow).getAllByRole('cell')[2]).toHaveTextContent('Terminé');
  expect(within(studentRow).getAllByText('Terminé')).toHaveLength(1);
  expect(within(studentRow).queryByText('En retard')).not.toBeInTheDocument();
});

it('replie sur un badge « Statut inconnu » plutôt que de faire planter la ligne', async () => {
  api.students.mockResolvedValue({
    data: [{ ...row, status: 'archived' as ApiClientDashboardStudent['status'] }],
    meta: { total: 1, page: 1, per_page: 100 },
  });
  renderDashboard();
  await screen.findByText('Alice Martin');
  const studentRow = screen.getByRole('row', { name: /Alice Martin/ });
  expect(within(studentRow).getByText('Statut inconnu')).toBeInTheDocument();
});

it.each(['ligne', 'bouton', 'Entrée', 'Espace', 'bouton au clavier'])(
  'ouvre le drawer depuis %s et restitue le focus à la fermeture',
  async (action) => {
    const user = userEvent.setup();
    renderDashboard();
    const button = await screen.findByRole('button', { name: 'Voir le détail de Alice Martin' });
    const studentRow = screen.getByRole('row', { name: /Alice Martin/ });
    const trigger = action.startsWith('bouton') ? button : studentRow;
    if (action === 'ligne' || action === 'bouton') await user.click(trigger);
    else {
      trigger.focus();
      await user.keyboard(action === 'Espace' ? ' ' : '{Enter}');
    }
    const drawer = await screen.findByRole('dialog', { name: 'Détail de Alice Martin' });
    await within(drawer).findByRole('button', { name: /^Tentative 1/ });
    expect(drawer).toHaveTextContent('Formation réelle');
    const header = drawer.querySelector('[data-slot="sheet-header"]');
    expect(header).toHaveTextContent('Alice Martin');
    expect(header).toHaveTextContent('alice@example.com');
    expect(header).not.toHaveTextContent(/Progression|40%|Accès valable|Échéance|En cours/);
    expect(within(drawer).queryByRole('button', { name: 'Replier' })).not.toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Contacter l’étudiant' })).toHaveAttribute(
      'href',
      'mailto:alice@example.com',
    );
    expect(historyApi.history).toHaveBeenCalledTimes(1);
    expect(historyApi.history).toHaveBeenCalledWith(row.id, 1, expect.any(AbortSignal));
    expect(historyApi.detail).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  },
);

it.each(['in_progress', 'not_started'] as const)(
  'ouvre la tentative du parcours %s dès l’ouverture du drawer et à sa réouverture',
  async (status) => {
    const currentAttempt: EnrollmentAttemptSummary = {
      ...attempt,
      status: 'in_progress',
      started_at: status === 'not_started' ? null : attempt.started_at,
      ended_at: null,
      interruption_reason: null,
      time_spent_seconds: status === 'not_started' ? 0 : attempt.time_spent_seconds,
    };
    api.students.mockResolvedValue({
      data: [{ ...row, status, started_at: currentAttempt.started_at }],
      meta: { total: 1, page: 1, per_page: 100 },
    });
    historyApi.history.mockResolvedValue({
      data: {
        enrollment: {
          id: row.id,
          learner_id: row.learner.id,
          learning_path_id: row.learning_path.id,
          status,
        },
        attempts: [currentAttempt],
      },
      meta: { total: 1, page: 1, per_page: 20 },
    });
    historyApi.detail.mockResolvedValue({ data: { attempt: currentAttempt, nodes: [] } });
    const user = userEvent.setup();
    renderDashboard();
    const trigger = await screen.findByRole('button', { name: 'Voir le détail de Alice Martin' });
    expect(historyApi.detail).not.toHaveBeenCalled();
    await user.click(trigger);
    await screen.findByRole('list', { name: 'Étapes de la tentative 1' });
    const attemptTrigger = screen.getByRole('button', { name: /^Tentative 1/ });
    expect(attemptTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(attemptTrigger).toHaveTextContent(
      status === 'not_started' ? 'Non commencée' : 'En cours',
    );
    expect(historyApi.detail).toHaveBeenCalledWith(
      row.id,
      currentAttempt.id,
      expect.any(AbortSignal),
    );
    await user.click(attemptTrigger);
    expect(screen.queryByRole('list', { name: /Étapes de/ })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(trigger);
    await screen.findByRole('list', { name: 'Étapes de la tentative 1' });
    expect(screen.getByRole('button', { name: /^Tentative 1/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  },
);

it('garde l’en-tête sans adresse fictive ni bouton Replier et conserve la fermeture du drawer', async () => {
  api.students.mockResolvedValue({
    data: [{ ...row, learner: { ...row.learner, email: null } }],
    meta: { total: 1, page: 1, per_page: 100 },
  });
  const user = userEvent.setup();
  renderDashboard();
  const trigger = await screen.findByRole('button', { name: 'Voir le détail de Alice Martin' });
  await user.click(trigger);
  const drawer = screen.getByRole('dialog');
  await within(drawer).findByRole('button', { name: /^Tentative 1/ });
  expect(within(drawer).getByText('E-mail indisponible')).toBeInTheDocument();
  expect(
    within(drawer).queryByRole('link', { name: 'Contacter l’étudiant' }),
  ).not.toBeInTheDocument();
  expect(within(drawer).queryByRole('button', { name: 'Replier' })).not.toBeInTheDocument();
  await user.click(within(drawer).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(trigger).toHaveFocus();
});

it('réutilise les tentatives de l’éditeur, les temps par cours et les évaluations affichées directement', async () => {
  const user = userEvent.setup();
  renderDashboard();
  const trigger = await screen.findByRole('button', { name: 'Voir le détail de Alice Martin' });
  await user.click(trigger);
  const drawer = screen.getByRole('dialog');
  await user.click(await within(drawer).findByRole('button', { name: /^Tentative 1/ }));
  const steps = await within(drawer).findByRole('list', { name: 'Étapes de la tentative 1' });
  expect(historyApi.detail).toHaveBeenCalledWith(row.id, attempt.id, expect.any(AbortSignal));
  expect(within(steps).queryByText('Cours historique')).not.toBeInTheDocument();
  expect(within(steps).getByText('Score : 0 %')).toBeVisible();
  expect(within(steps).getByText('Temps passé : 1 min 1 s')).toBeVisible();
  expect(within(steps).getByText('Tentative : 1/1')).toBeVisible();
  expect(
    within(steps).queryByRole('button', { name: /Évaluation historique/ }),
  ).not.toBeInTheDocument();
  await user.click(within(steps).getByRole('button', { name: /Voir le temps par cours/ }));
  expect(within(steps).getByText('Cours historique')).toBeInTheDocument();
  expect(within(steps).getByText('1 min 4 s')).toBeInTheDocument();
  expect(within(steps).getByText('Score : 0 %')).toBeInTheDocument();
  expect(within(steps).getByText('Temps passé : 1 min 1 s')).toBeInTheDocument();
  expect(within(steps).getByText('Tentative : 1/1')).toBeInTheDocument();
  expect(drawer).not.toHaveTextContent(/Disponible depuis|Bloqué par|Acquis conservé depuis/);
  expect(drawer).not.toHaveTextContent(/Modules a faire|Écoulé ·|Envoyer un message/);
  await user.click(within(drawer).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await user.click(trigger);
  const reopenedAttempt = await screen.findByRole('button', { name: /^Tentative 1/ });
  expect(reopenedAttempt).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText('Cours historique')).not.toBeInTheDocument();
  expect(historyApi.detail).toHaveBeenCalledTimes(1);
});

it('sélectionne l’inscription et non l’apprenant lorsque le même étudiant suit deux parcours', async () => {
  api.students.mockResolvedValue({
    data: [
      row,
      { ...row, id: 'enrollment-2', learning_path: { id: 'path-2', name: 'Autre parcours' } },
    ],
    meta: { total: 2, page: 1, per_page: 100 },
  });
  const user = userEvent.setup();
  renderDashboard();
  await screen.findByText('Autre parcours');
  const rows = screen.getAllByRole('row', { name: /Alice Martin/ });
  await user.click(rows[0]);
  await screen.findByRole('button', { name: /^Tentative 1/ });
  expect(historyApi.history).toHaveBeenLastCalledWith(row.id, 1, expect.any(AbortSignal));
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await user.click(rows[1]);
  const drawer = screen.getByRole('dialog');
  await within(drawer).findByRole('button', { name: /^Tentative 1/ });
  expect(drawer).toHaveTextContent('Autre parcours');
  expect(historyApi.history).toHaveBeenLastCalledWith('enrollment-2', 1, expect.any(AbortSignal));
});

it.each(['session', 'identité', 'tenant', 'déconnexion'])(
  'ferme le drawer et retire les anciennes tentatives au changement de %s',
  async (change) => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(await screen.findByRole('button', { name: 'Voir le détail de Alice Martin' }));
    await user.click(await screen.findByRole('button', { name: /^Tentative 1/ }));
    await screen.findByText('Module historique');
    api.students.mockReturnValue(new Promise(() => {}));
    api.overview.mockReturnValue(new Promise(() => {}));
    act(() => {
      if (change === 'session') useAuthStore.setState({ sessionId: 'session-2' });
      else if (change === 'identité') {
        useAuthStore.setState({ user: { ...useAuthStore.getState().user!, id: 'manager-2' } });
      } else if (change === 'tenant') {
        useTenantStore.setState({
          tenant: { id: 'tenant-2' } as NonNullable<
            ReturnType<typeof useTenantStore.getState>['tenant']
          >,
        });
      } else useAuthStore.setState({ user: null, role: null, sessionId: null });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Module historique')).not.toBeInTheDocument();
    expect(historyApi.history).toHaveBeenCalledTimes(1);
    expect(historyApi.detail).toHaveBeenCalledTimes(1);
  },
);

it('permet de réessayer un historique en erreur et affiche son état vide sans données fictives', async () => {
  historyApi.history.mockRejectedValueOnce(new Error('indisponible'));
  const user = userEvent.setup();
  renderDashboard();
  await user.click(await screen.findByRole('button', { name: 'Voir le détail de Alice Martin' }));
  const drawer = screen.getByRole('dialog');
  expect(await within(drawer).findByRole('alert')).toHaveTextContent(
    'Impossible de charger l’historique',
  );
  historyApi.history.mockResolvedValue({
    data: {
      enrollment: {
        id: row.id,
        learner_id: row.learner.id,
        learning_path_id: row.learning_path.id,
        status: row.status,
      },
      attempts: [],
    },
    meta: { total: 0, page: 1, per_page: 20 },
  });
  await user.click(within(drawer).getByRole('button', { name: 'Réessayer l’historique' }));
  expect(await within(drawer).findByText('Aucune tentative à afficher.')).toBeInTheDocument();
  expect(historyApi.detail).not.toHaveBeenCalled();
});
