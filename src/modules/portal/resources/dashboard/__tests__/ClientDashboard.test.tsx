import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import ClientDashboard from '../ClientDashboard';
import { clientDashboardApi } from '../api';
import type { ApiClientDashboardStudent } from '../types';

// Recharts needs a measured container in jsdom; keep the chart's accessible outer value real.
jest.mock('@/components/ui/chart', () => ({ ChartContainer: () => <div /> }));

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
  expires_at: '2026-12-31T23:59:59.000Z',
};

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <ClientDashboard />
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
    data: { learning_paths: 12, modules: { completed: 65, in_progress: 19, not_started: 7 } },
  });
  api.students.mockResolvedValue({ data: [row], meta: { total: 1, page: 1, per_page: 100 } });
});

afterEach(() => useAuthStore.setState({ user: null, role: null, sessionId: null }));

it('garde les quatre cartes et la table mais remplace leurs données de démonstration', async () => {
  renderDashboard();
  expect(await screen.findByText('Alice Martin')).toBeInTheDocument();
  for (const value of ['12', '65', '19', '7']) expect(screen.getByText(value)).toBeInTheDocument();
  expect(screen.getByText('Formation réelle')).toBeInTheDocument();
  expect(screen.getByText('40%')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Progression moyenne : 40%' })).toBeInTheDocument();
  expect(screen.queryByText('Amélie Laurent')).not.toBeInTheDocument();
  expect(screen.queryByText('January - June 2024')).not.toBeInTheDocument();
  const detail = screen.getByRole('button', { name: 'Voir le détail de Alice Martin' });
  expect(detail).toBeDisabled();
  fireEvent.click(screen.getByText('Alice Martin'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('utilise une teinte discrète de la couleur des progressions pour la carte Terminés uniquement', async () => {
  renderDashboard();
  await screen.findByText('65');
  const completedCard = screen.getByText('Terminés').closest('[data-slot="card"]');
  expect(completedCard).toHaveClass('bg-(--color-primary)/10');
  expect(completedCard).not.toHaveClass('bg-card', 'bg-linear-to-br', 'bg-(--color-primary)');
  expect(screen.getByText('Terminés')).toHaveClass('text-(--color-primary)');
  expect(screen.getByText('65')).toHaveClass('text-(--color-primary)');
  for (const description of [
    'Nombre de parcours suivis',
    'Modules en cours',
    'Modules à réaliser',
  ]) {
    expect(screen.getByText(description).closest('[data-slot="card"]')).toHaveClass('bg-card');
  }
});

it.each([
  ['Nombre de parcours suivis', false],
  ['Modules terminés', true],
  ['Modules en cours', false],
  ['Modules à réaliser', false],
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

it('attend toutes les pages avant de calculer une moyenne et permet de chercher sur toutes les lignes', async () => {
  api.students.mockImplementation(async (page = 1) => ({
    data: [
      {
        ...row,
        id: `enrollment-${page}`,
        learner: { ...row.learner, first_name: page === 1 ? 'Alice' : 'Béatrice' },
        progress_percent: page === 1 ? 40 : 80,
      },
    ],
    meta: { total: 2, page, per_page: 1 },
  }));
  renderDashboard();
  expect(await screen.findByText('Béatrice Martin')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Progression moyenne : 60%' })).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Rechercher un étudiant' }), {
    target: { value: '  Béatrice  ' },
  });
  expect(screen.queryByText('Alice Martin')).not.toBeInTheDocument();
  expect(screen.getByText('Béatrice Martin')).toBeInTheDocument();
  expect(api.students).toHaveBeenCalledTimes(2);
});

it('ne montre aucun nombre fictif pendant le chargement', () => {
  api.overview.mockReturnValue(new Promise(() => {}));
  api.students.mockReturnValue(new Promise(() => {}));
  renderDashboard();
  expect(screen.queryByText('86')).not.toBeInTheDocument();
  expect(screen.queryByText('Aucun étudiant trouvé')).not.toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Progression moyenne : indisponible' }),
  ).toBeInTheDocument();
});

it('affiche une erreur de liste et permet de réessayer sans perdre les KPI', async () => {
  api.students.mockRejectedValueOnce(new Error('erreur réseau'));
  renderDashboard();
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger les étudiants');
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
  expect(screen.getByRole('img', { name: 'Progression moyenne : 0%' })).toBeInTheDocument();
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

it.each([
  ['not_started', 'Non commencé'],
  ['in_progress', 'En cours'],
  ['completed', 'Terminé'],
  ['expired', 'Expiré'],
  ['failed', 'Échoué'],
] as const)(
  'affiche le statut API %s dans la cellule échéance même à 100 %%',
  async (status, label) => {
    api.students.mockResolvedValue({
      data: [{ ...row, status, progress_percent: 100, expires_at: null }],
      meta: { total: 1, page: 1, per_page: 100 },
    });
    renderDashboard();
    await screen.findByText('Alice Martin');
    expect(screen.queryByRole('columnheader', { name: 'Statut' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    const studentRow = screen.getByRole('row', { name: /Alice Martin/ });
    const cells = within(studentRow).getAllByRole('cell');
    expect(cells).toHaveLength(5);
    expect(cells[2]).toHaveTextContent(label);
    expect(cells[2]).toHaveTextContent('—');
    if (status !== 'completed') {
      expect(within(studentRow).queryByText('Terminé')).not.toBeInTheDocument();
    }
    expect(within(studentRow).getByRole('button')).toBeDisabled();
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
    const deadlineCell = within(studentRow).getAllByRole('cell')[2];
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
