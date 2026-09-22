import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import type { ApiDashboardFormation, ApiDashboardOverview } from '@/shared/types/dashboard.types';
import { EditorDashboard } from '../EditorDashboard';
import { editorDashboardApi } from '../api';
import { ReenrollmentBadge } from '../components/ReenrollmentBadge';
import { dashboardEnrollmentStatuses } from '../data/enrollmentStatuses';

jest.mock('../api', () => ({
  editorDashboardApi: { overview: jest.fn(), formations: jest.fn(), enrollments: jest.fn() },
}));

const overview: ApiDashboardOverview = {
  catalog: { total: 21, published: 15, unpublished: 6 },
  students: {
    unique_students: 2,
    total_enrollments: 6,
    average_progress_percent: 37.5,
    status_counts: { completed: 2, in_progress: 1, not_started: 1, failed: 1, expired: 1 },
  },
};
const formation: ApiDashboardFormation = {
  id: 'real-formation-id',
  name: 'Formation réelle',
  is_published: true,
  total_enrollments: 6,
  completion_rate: 33.33,
  status_counts: { ...overview.students.status_counts },
};
const api = jest.mocked(editorDashboardApi);
const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

afterAll(() => {
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
});

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return {
    ...render(
      <QueryClientProvider client={client}>
        <EditorDashboard />
      </QueryClientProvider>,
    ),
    client,
  };
}

function formationSection() {
  return screen.getByRole('region', { name: 'Suivi des étudiants par formation' });
}

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({
    user: { id: 'editor-1', name: 'Éditeur', email: 'editor@example.com', role: Role.EDITOR },
    role: Role.EDITOR,
    sessionId: 'session-1',
  });
  useTenantStore.setState({ tenant: null, resolutionStatus: 'resolved' });
  api.overview.mockResolvedValue({ data: overview });
  api.formations.mockResolvedValue({
    data: [formation],
    meta: { total: 21, page: 1, per_page: 20 },
  });
});

afterEach(() => {
  useAuthStore.setState({ user: null, role: null, sessionId: null });
});

describe('dashboard éditeur connecté', () => {
  it('charge les chiffres globaux du serveur sans les déduire de la page visible', async () => {
    renderDashboard();
    expect(await screen.findByText('2 étudiants · 6 inscriptions')).toBeInTheDocument();
    const catalog = screen.getByRole('region', { name: 'Catalogue des formations' });
    expect(
      within(catalog)
        .getAllByRole('definition')
        .map((item) => item.textContent),
    ).toEqual(['21', '15', '6']);
    expect(screen.getByRole('link', { name: 'Gérer les formations' })).toHaveAttribute(
      'href',
      '/admin/programs',
    );
    const progress = screen.getByRole('progressbar', { name: 'Progression moyenne des étudiants' });
    await waitFor(() => expect(progress).toHaveAttribute('aria-valuenow', '37.5'));
    expect(
      screen.getByText(/Moyenne de l’avancement de toutes les inscriptions/),
    ).toBeInTheDocument();
    expect(api.overview).toHaveBeenCalledTimes(1);
    expect(api.formations).toHaveBeenCalledWith({
      q: '',
      sort_by: 'enrolled',
      page: 1,
      per_page: 20,
    });
  });

  it('affiche les cinq statuts, les réinscriptions comptées et le taux de complétion serveur', async () => {
    renderDashboard();
    await screen.findByRole('heading', { name: formation.name });
    const card = within(formationSection()).getByRole('listitem');
    expect(within(card).getByRole('definition')).toHaveTextContent('6');
    dashboardEnrollmentStatuses.forEach((status) => {
      const badge = within(card).getByLabelText(
        `${status.label} : ${formation.status_counts[status.key]} — ${formation.name}`,
      );
      expect(badge).toHaveClass(...status.badgeClassName.split(' '));
      expect(badge.tagName).toBe('SPAN');
    });
    await waitFor(() =>
      expect(within(card).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33'),
    );
    expect(within(card).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.enrollments).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/Étudiant 001|Les fondamentaux du management/),
    ).not.toBeInTheDocument();
  });

  it('affiche des chargements sans nombres fictifs', () => {
    api.overview.mockReturnValue(new Promise(() => {}));
    api.formations.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByRole('status', { name: 'Chargement de la synthèse' })).toBeInTheDocument();
    expect(screen.getByText('Chargement des formations…')).toBeInTheDocument();
    expect(screen.queryByRole('definition')).not.toBeInTheDocument();
    expect(screen.queryByText('Aucune formation à afficher.')).not.toBeInTheDocument();
  });

  it('permet de réessayer une synthèse en erreur sans masquer les formations', async () => {
    api.overview.mockRejectedValueOnce(new Error('indisponible'));
    const user = userEvent.setup();
    renderDashboard();
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger la synthèse');
    expect(await screen.findByRole('heading', { name: formation.name })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réessayer la synthèse' }));
    expect(await screen.findByText('2 étudiants · 6 inscriptions')).toBeInTheDocument();
    expect(api.overview).toHaveBeenCalledTimes(2);
  });

  it('ne transforme pas une erreur de liste en liste vide et permet de réessayer', async () => {
    api.formations.mockRejectedValueOnce(new Error('indisponible'));
    const user = userEvent.setup();
    renderDashboard();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger les formations',
    );
    expect(screen.queryByText('Aucune formation à afficher.')).not.toBeInTheDocument();
    expect(await screen.findByText('2 étudiants · 6 inscriptions')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réessayer les formations' }));
    expect(await screen.findByRole('heading', { name: formation.name })).toBeInTheDocument();
  });

  it('envoie la recherche au serveur sans recalculer les totaux globaux', async () => {
    api.formations.mockImplementation(async (params) => ({
      data: params.q ? [] : [formation],
      meta: { total: params.q ? 0 : 21, page: 1, per_page: 20 },
    }));
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByRole('heading', { name: formation.name });
    await user.type(screen.getByRole('searchbox'), '  PREVENIR  ');
    await waitFor(() =>
      expect(api.formations).toHaveBeenLastCalledWith({
        q: 'PREVENIR',
        sort_by: 'enrolled',
        page: 1,
        per_page: 20,
      }),
    );
    expect(
      await screen.findByText('Aucune formation ne correspond à votre recherche.'),
    ).toBeInTheDocument();
    expect(screen.getByText('2 étudiants · 6 inscriptions')).toBeInTheDocument();
    expect(api.overview).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(await screen.findByRole('heading', { name: formation.name })).toBeInTheDocument();
  });

  it('pagine côté serveur et revient à la première page au changement de tri', async () => {
    api.formations.mockImplementation(async (params) => ({
      data: [{ ...formation, name: `Formation page ${params.page}` }],
      meta: { total: 21, page: params.page, per_page: params.per_page },
    }));
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByRole('heading', { name: 'Formation page 1' });
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    await screen.findByRole('heading', { name: 'Formation page 2' });
    expect(api.formations).toHaveBeenLastCalledWith({
      q: '',
      sort_by: 'enrolled',
      page: 2,
      per_page: 20,
    });
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Trier les formations' }), {
      key: 'ArrowDown',
    });
    await user.click(await screen.findByRole('option', { name: 'Plus d’échecs' }));
    await waitFor(() =>
      expect(api.formations).toHaveBeenLastCalledWith({
        q: '',
        sort_by: 'failed',
        page: 1,
        per_page: 20,
      }),
    );
    expect(await screen.findByRole('heading', { name: 'Formation page 1' })).toBeInTheDocument();
    expect(
      api.formations.mock.calls.some(
        ([params]) => params.page === 2 && params.sort_by === 'failed',
      ),
    ).toBe(false);
  });

  it('gère un catalogue vide et une formation sans inscription', async () => {
    const zero = { completed: 0, in_progress: 0, not_started: 0, failed: 0, expired: 0 };
    api.overview.mockResolvedValue({
      data: {
        catalog: { total: 0, published: 0, unpublished: 0 },
        students: {
          unique_students: 0,
          total_enrollments: 0,
          average_progress_percent: 0,
          status_counts: zero,
        },
      },
    });
    api.formations.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, per_page: 20 } });
    const { client } = renderDashboard();
    expect(await screen.findByText('Aucune formation à afficher.')).toBeInTheDocument();
    expect(screen.getByText('0 étudiants · 0 inscriptions')).toBeInTheDocument();
    api.formations.mockResolvedValue({
      data: [{ ...formation, total_enrollments: 0, completion_rate: 0, status_counts: zero }],
      meta: { total: 1, page: 1, per_page: 20 },
    });
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['editor-dashboard'] });
    });
    await screen.findByRole('heading', { name: formation.name });
    expect(within(formationSection()).getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
    expect(within(formationSection()).getByRole('definition')).toHaveTextContent('0');
  });

  it('ne réutilise pas les données d’un autre utilisateur après changement de session', async () => {
    renderDashboard();
    await screen.findByRole('heading', { name: formation.name });
    api.overview.mockReturnValue(new Promise(() => {}));
    api.formations.mockReturnValue(new Promise(() => {}));
    act(() =>
      useAuthStore.setState({
        user: {
          id: 'editor-2',
          name: 'Autre éditeur',
          email: 'other@example.com',
          role: Role.EDITOR,
        },
        sessionId: 'session-2',
      }),
    );
    expect(screen.queryByRole('heading', { name: formation.name })).not.toBeInTheDocument();
    expect(screen.queryByText('2 étudiants · 6 inscriptions')).not.toBeInTheDocument();
    await waitFor(() => expect(api.overview).toHaveBeenCalledTimes(2));
  });

  it('ne lance pas ces queries pour un client manager', () => {
    useAuthStore.setState({ role: Role.CLIENT_MANAGER });
    renderDashboard();
    expect(api.overview).not.toHaveBeenCalled();
    expect(api.formations).not.toHaveBeenCalled();
  });

  it('recharge les données au retour sur le dashboard même si le cache est récent', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const view = (show: boolean) => (
      <QueryClientProvider client={client}>{show && <EditorDashboard />}</QueryClientProvider>
    );
    const { rerender } = render(view(true));
    await screen.findByRole('heading', { name: formation.name });
    await screen.findByText('2 étudiants · 6 inscriptions');
    rerender(view(false));
    api.formations.mockResolvedValue({
      data: [{ ...formation, name: 'Formation renommée' }],
      meta: { total: 21, page: 1, per_page: 20 },
    });
    rerender(view(true));
    expect(await screen.findByRole('heading', { name: 'Formation renommée' })).toBeInTheDocument();
    expect(api.overview).toHaveBeenCalledTimes(2);
    expect(api.formations).toHaveBeenCalledTimes(2);
    client.clear();
  });
});

describe('badge de réinscription prêt pour le futur panneau', () => {
  it('ne marque pas la première inscription et reprend le numéro fourni par le serveur', () => {
    const { container, rerender } = render(<ReenrollmentBadge number={0} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ReenrollmentBadge number={1} />);
    expect(screen.getByText('Réinscription 1')).toHaveAttribute('data-slot', 'badge');
    rerender(<ReenrollmentBadge number={2} />);
    expect(screen.getByText('Réinscription 2')).toBeInTheDocument();
  });
});
