import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { enrollmentHistoryApi } from '@/shared/api/enrollment-history.api';
import { StudentAttemptHistory } from '../StudentAttemptHistory';
import type {
  EnrollmentAttemptDetailResponse,
  EnrollmentAttemptSummary,
  EnrollmentHistoryResponse,
} from '@/shared/types/enrollment-history.types';

jest.mock('@/shared/api/enrollment-history.api', () => ({
  enrollmentHistoryApi: { history: jest.fn(), detail: jest.fn() },
}));

const api = jest.mocked(enrollmentHistoryApi);
const attempt: EnrollmentAttemptSummary = {
  id: 'attempt-1',
  attempt_number: 1,
  status: 'failed',
  available_at: '2026-09-01T09:00:00Z',
  started_at: '2026-09-02T10:00:00Z',
  ended_at: '2026-09-02T11:00:00Z',
  time_spent_seconds: 61,
  interruption_reason: {
    code: 'evaluation_failed',
    node: { type: 'evaluation', key: 'exam-1', title: 'Certification archivée' },
    message: 'Échec à la certification archivée.',
  },
};
const history: EnrollmentHistoryResponse = {
  data: {
    enrollment: {
      id: 'enrollment-1',
      learner_id: 'learner-1',
      learning_path_id: 'path-1',
      status: 'failed',
    },
    attempts: [attempt],
  },
  meta: { page: 1, per_page: 20, total: 1 },
};
const detail: EnrollmentAttemptDetailResponse = {
  data: {
    attempt,
    nodes: [
      {
        type: 'evaluation',
        key: 'exam-1',
        title: 'Certification archivée',
        position: 1,
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
const currentAttempt: EnrollmentAttemptSummary = {
  ...attempt,
  id: 'attempt-current',
  attempt_number: 2,
  status: 'in_progress',
  ended_at: null,
  interruption_reason: null,
};
const clients: QueryClient[] = [];

function renderHistory(enrollmentId = 'enrollment-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  const view = render(<StudentAttemptHistory enrollmentId={enrollmentId} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...view, client };
}

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({
    user: { id: 'editor-1', name: 'Éditeur', email: 'editor@example.com', role: Role.EDITOR },
    role: Role.EDITOR,
    sessionId: 'session-1',
  });
  useTenantStore.setState({ tenant: null, resolutionStatus: 'resolved' });
  api.history.mockResolvedValue(history);
  api.detail.mockResolvedValue(detail);
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  useAuthStore.setState({ user: null, role: null, sessionId: null });
});

it('ne charge le détail qu’à l’ouverture et démonte les étapes à la fermeture', async () => {
  const user = userEvent.setup();
  renderHistory();
  expect(screen.getByRole('status')).toHaveTextContent('Chargement de l’historique');
  const trigger = await screen.findByRole('button', { name: /Tentative 1/ });
  expect(api.history).toHaveBeenCalledWith('enrollment-1', 1, expect.any(AbortSignal));
  expect(api.detail).not.toHaveBeenCalled();
  expect(screen.getByText('Temps passé : 1 min 1 s')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent(attempt.interruption_reason!.message);
  expect(screen.queryByText('Reprise du parcours')).not.toBeInTheDocument();
  trigger.focus();
  await user.keyboard('{Enter}');
  const steps = await screen.findByRole('list', { name: 'Étapes de la tentative 1' });
  expect(within(steps).queryByRole('button')).not.toBeInTheDocument();
  expect(within(steps).getByText('Temps passé : 1 min 1 s')).toBeInTheDocument();
  expect(within(steps).getByText('Score : 0 %')).toBeInTheDocument();
  expect(within(steps).queryByText(/Début :|Fin :/)).not.toBeInTheDocument();
  expect(api.detail).toHaveBeenCalledTimes(1);
  expect(api.detail).toHaveBeenCalledWith('enrollment-1', 'attempt-1', expect.any(AbortSignal));
  await user.click(trigger);
  expect(screen.queryByText('Certification archivée', { exact: true })).not.toBeInTheDocument();
  expect(api.detail).toHaveBeenCalledTimes(1);
});

it('ouvre automatiquement la tentative en cours après chargement sans ouvrir les tentatives terminées', async () => {
  api.history.mockResolvedValue({
    ...history,
    data: { ...history.data, attempts: [attempt, currentAttempt] },
    meta: { ...history.meta, total: 2 },
  });
  api.detail.mockResolvedValue({ data: { attempt: currentAttempt, nodes: [] } });
  renderHistory();
  expect(api.detail).not.toHaveBeenCalled();
  await screen.findByRole('list', { name: 'Étapes de la tentative 2' });
  expect(screen.getByRole('button', { name: /Tentative 2 En cours/ })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(screen.getByRole('button', { name: /Tentative 1 Échouée/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  expect(api.detail).toHaveBeenCalledTimes(1);
  expect(api.detail).toHaveBeenCalledWith(
    'enrollment-1',
    currentAttempt.id,
    expect.any(AbortSignal),
  );
});

it('respecte la fermeture et la sélection manuelles même après un rafraîchissement de l’historique', async () => {
  const user = userEvent.setup();
  api.history.mockResolvedValue({
    ...history,
    data: { ...history.data, attempts: [currentAttempt, attempt] },
    meta: { ...history.meta, total: 2 },
  });
  api.detail.mockImplementation(async (_enrollmentId, attemptId) => ({
    data: { attempt: attemptId === currentAttempt.id ? currentAttempt : attempt, nodes: [] },
  }));
  const { client } = renderHistory();
  await screen.findByRole('list', { name: 'Étapes de la tentative 2' });
  await user.click(screen.getByRole('button', { name: /Tentative 2 En cours/ }));
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['enrollment-history'] });
  });
  expect(screen.getByRole('button', { name: /Tentative 2 En cours/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  expect(screen.queryByRole('list', { name: /Étapes de/ })).not.toBeInTheDocument();
  expect(api.detail).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: /Tentative 1 Échouée/ }));
  await screen.findByRole('list', { name: 'Étapes de la tentative 1' });
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['enrollment-history'] });
  });
  expect(screen.getByRole('button', { name: /Tentative 1 Échouée/ })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(screen.getByRole('button', { name: /Tentative 2 En cours/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

it('retrouve la tentative en cours en revenant sur sa page et lors du changement d’inscription', async () => {
  const user = userEvent.setup();
  api.history.mockImplementation(async (enrollmentId, page = 1) => ({
    ...history,
    data: {
      enrollment: { ...history.data.enrollment, id: enrollmentId },
      attempts: page === 1 ? [currentAttempt] : [attempt],
    },
    meta: { total: 2, page, per_page: 1 },
  }));
  api.detail.mockResolvedValue({ data: { attempt: currentAttempt, nodes: [] } });
  const { rerender } = renderHistory();
  await screen.findByRole('list', { name: 'Étapes de la tentative 2' });
  await user.click(screen.getByRole('button', { name: 'Tentatives suivantes' }));
  await screen.findByText('Page 2 sur 2');
  expect(screen.queryByRole('list', { name: /Étapes de/ })).not.toBeInTheDocument();
  expect(api.detail).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Tentatives précédentes' }));
  await screen.findByRole('list', { name: 'Étapes de la tentative 2' });
  await user.click(screen.getByRole('button', { name: /Tentative 2 En cours/ }));
  rerender(<StudentAttemptHistory enrollmentId="enrollment-2" />);
  await screen.findByRole('list', { name: 'Étapes de la tentative 2' });
  expect(api.detail).toHaveBeenLastCalledWith(
    'enrollment-2',
    currentAttempt.id,
    expect.any(AbortSignal),
  );
});

it('pagine sur le serveur, utilise le total global et referme la tentative précédente', async () => {
  const user = userEvent.setup();
  api.history.mockImplementation(async (_id, page = 1) => ({
    ...history,
    data: {
      ...history.data,
      attempts:
        page === 1
          ? Array.from({ length: 20 }, (_, index) => ({
              ...attempt,
              id: `attempt-${index + 1}`,
              attempt_number: index + 1,
            }))
          : [{ ...attempt, id: 'attempt-21', attempt_number: 21 }],
    },
    meta: { total: 21, page, per_page: 20 },
  }));
  renderHistory();
  await screen.findByText('Page 1 sur 2');
  expect(screen.getByText(/^21 tentatives/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tentatives précédentes' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: /Tentative 1 Échouée/ }));
  await screen.findByRole('list', { name: 'Étapes de la tentative 1' });
  await user.click(screen.getByRole('button', { name: 'Tentatives suivantes' }));
  await screen.findByText('Page 2 sur 2');
  expect(api.history).toHaveBeenLastCalledWith('enrollment-1', 2, expect.any(AbortSignal));
  expect(screen.queryByRole('list', { name: /Étapes de la tentative/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Tentative 21/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  expect(screen.getByRole('button', { name: 'Tentatives suivantes' })).toBeDisabled();
  expect(api.detail).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Tentatives précédentes' }));
  await screen.findByText('Page 1 sur 2');
  expect(screen.getByRole('button', { name: /Tentative 1 Échouée/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

it('permet de réessayer l’historique en erreur sans annoncer une liste vide', async () => {
  const user = userEvent.setup();
  api.history.mockRejectedValueOnce(new Error('indisponible'));
  renderHistory();
  expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger l’historique');
  expect(screen.queryByText('Aucune tentative à afficher.')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Réessayer l’historique' }));
  await screen.findByRole('button', { name: /Tentative 1/ });
  expect(api.history).toHaveBeenCalledTimes(2);
  expect(api.detail).not.toHaveBeenCalled();
});

it('permet de réessayer le détail sans recharger la liste', async () => {
  const user = userEvent.setup();
  api.detail.mockRejectedValueOnce(new Error('indisponible'));
  renderHistory();
  await user.click(await screen.findByRole('button', { name: /Tentative 1/ }));
  await screen.findByText('Impossible de charger les étapes de cette tentative.');
  await user.click(screen.getByRole('button', { name: 'Réessayer les étapes' }));
  await screen.findByRole('list', { name: 'Étapes de la tentative 1' });
  expect(api.history).toHaveBeenCalledTimes(1);
  expect(api.detail).toHaveBeenCalledTimes(2);
});

it('affiche un chargement propre pour un détail encore en attente', async () => {
  api.detail.mockReturnValue(new Promise(() => {}));
  const user = userEvent.setup();
  renderHistory();
  await user.click(await screen.findByRole('button', { name: /Tentative 1/ }));
  expect(screen.getByRole('status')).toHaveTextContent('Chargement des étapes…');
  expect(screen.queryByRole('list', { name: /Étapes de/ })).not.toBeInTheDocument();
});

it('ouvre la tentative non commencée sans inventer de début et respecte sa fermeture manuelle', async () => {
  const user = userEvent.setup();
  const unstartedAttempt: EnrollmentAttemptSummary = {
    ...attempt,
    status: 'in_progress',
    started_at: null,
    ended_at: null,
    interruption_reason: null,
    time_spent_seconds: 0,
  };
  api.history.mockResolvedValue({
    ...history,
    data: {
      ...history.data,
      enrollment: { ...history.data.enrollment, status: 'not_started' },
      attempts: [unstartedAttempt],
    },
  });
  api.detail.mockResolvedValue({ data: { attempt: unstartedAttempt, nodes: [] } });
  const { client } = renderHistory();
  const trigger = await screen.findByRole('button', { name: /Tentative 1/ });
  expect(within(trigger).getByText('Non commencée', { exact: true })).toBeInTheDocument();
  expect(trigger).toHaveTextContent('Début : non commencée');
  expect(trigger).not.toHaveTextContent('Disponible depuis');
  expect(trigger).not.toHaveTextContent('Temps passé');
  expect(trigger.querySelector('.lucide-timer')).not.toBeInTheDocument();
  expect(trigger.querySelectorAll('time')).toHaveLength(0);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await screen.findByRole('list', { name: 'Étapes de la tentative 1' });
  expect(api.detail).toHaveBeenCalledTimes(1);
  expect(api.detail).toHaveBeenCalledWith('enrollment-1', attempt.id, expect.any(AbortSignal));
  expect(
    screen.queryByText(/Fin :|Reprise du parcours|Motif d’interruption/),
  ).not.toBeInTheDocument();
  await user.click(trigger);
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['enrollment-history'] });
  });
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('list', { name: /Étapes de/ })).not.toBeInTheDocument();
  expect(api.detail).toHaveBeenCalledTimes(1);
});

it.each(['completed', 'failed', 'in_progress'] as const)(
  'respecte le résultat %s et les dates retournées',
  async (status) => {
    api.history.mockResolvedValue({
      ...history,
      data: { ...history.data, attempts: [{ ...attempt, status }] },
    });
    renderHistory();
    const trigger = await screen.findByRole('button', { name: /Tentative 1/ });
    expect(trigger).toHaveTextContent(
      { completed: 'Réussie', failed: 'Échouée', in_progress: 'En cours' }[status],
    );
    expect(trigger).toHaveTextContent('Temps passé : 1 min 1 s');
    expect(trigger.querySelector('.lucide-timer')).toHaveAttribute('aria-hidden', 'true');
    expect([...trigger.querySelectorAll('time')].map((time) => time.dateTime)).toEqual([
      attempt.started_at,
      attempt.ended_at,
    ]);
    expect(trigger).not.toHaveTextContent('Disponible depuis');
  },
);

it('ne génère rien lorsque l’historique est vide', async () => {
  api.history.mockResolvedValue({
    ...history,
    data: { ...history.data, attempts: [] },
    meta: { ...history.meta, total: 0 },
  });
  renderHistory();
  expect(await screen.findByText('Aucune tentative à afficher.')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(api.detail).not.toHaveBeenCalled();
});

it('réinitialise la pagination quand l’inscription change', async () => {
  const user = userEvent.setup();
  api.history.mockImplementation(async (_id, page = 1) => ({
    ...history,
    meta: { total: 21, page, per_page: 20 },
  }));
  const { rerender } = renderHistory();
  await screen.findByText('Page 1 sur 2');
  await user.click(screen.getByRole('button', { name: 'Tentatives suivantes' }));
  await screen.findByText('Page 2 sur 2');
  rerender(<StudentAttemptHistory enrollmentId="enrollment-2" />);
  await waitFor(() =>
    expect(api.history).toHaveBeenLastCalledWith('enrollment-2', 1, expect.any(AbortSignal)),
  );
  await screen.findByText('Page 1 sur 2');
});

it('retire immédiatement l’historique et les détails lors d’un changement de session', async () => {
  const user = userEvent.setup();
  renderHistory();
  await user.click(await screen.findByRole('button', { name: /Tentative 1/ }));
  await screen.findByRole('list', { name: 'Étapes de la tentative 1' });
  api.history.mockReturnValue(new Promise(() => {}));
  act(() => useAuthStore.setState({ sessionId: 'session-2' }));
  expect(screen.queryByRole('list', { name: /Étapes de la tentative/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Tentative 1/ })).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Chargement de l’historique');
  expect(api.detail).toHaveBeenCalledTimes(1);
});

it('ne charge rien sans utilisateur ou identifiant valide', () => {
  useAuthStore.setState({ user: null, role: null });
  const { rerender } = renderHistory();
  expect(screen.getByText('Historique indisponible.')).toBeInTheDocument();
  rerender(<StudentAttemptHistory enrollmentId=" " />);
  expect(api.history).not.toHaveBeenCalled();
  expect(api.detail).not.toHaveBeenCalled();
});
