import { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import type { DateRange } from 'react-day-picker';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import type {
  ApiDashboardEnrollment,
  ApiDashboardEnrollmentsPage,
} from '@/shared/types/dashboard.types';
import { editorDashboardApi } from '../api';
import { enrollmentHistoryApi } from '@/shared/api/enrollment-history.api';
import {
  FormationStudentsSheet,
  type FormationStudentSelection,
} from '../components/FormationStudentsSheet';
import type { DashboardFormation } from '../types';
import type {
  EnrollmentAttemptSummary,
  EnrollmentHistoryResponse,
} from '@/shared/types/enrollment-history.types';

jest.mock('../api', () => ({
  editorDashboardApi: { overview: jest.fn(), formations: jest.fn(), enrollments: jest.fn() },
}));
jest.mock('@/shared/api/enrollment-history.api', () => ({
  enrollmentHistoryApi: { history: jest.fn(), detail: jest.fn() },
}));
// Keep the real date popovers, draft/apply behavior and query hooks. Only date picking is doubled.
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
    </div>
  ),
}));

const api = jest.mocked(editorDashboardApi);
const historyApi = jest.mocked(enrollmentHistoryApi);
const formation: DashboardFormation = {
  id: 'formation-1',
  name: 'Formation serveur',
  isPublished: true,
  totalEnrollments: 999, // Deliberately stale: the sheet must use its own server summary.
  completionRate: 0,
  statusCounts: { completed: 0, in_progress: 0, not_started: 0, failed: 999, expired: 0 },
};
const enrollment: ApiDashboardEnrollment = {
  id: 'enrollment-1',
  learner: {
    id: 'learner-1',
    first_name: 'Alice',
    last_name: 'Martin',
    email: 'alice@example.com',
  },
  status: 'failed',
  enrolled_at: '2026-08-01T09:00:00Z',
  started_at: '2026-09-02T09:00:00Z',
  ended_at: '2026-09-03T10:00:00Z',
  expires_at: '2026-12-31T23:59:59Z',
  attempts_count: 3,
  time_spent_seconds: 61,
};
const otherEnrollment: ApiDashboardEnrollment = {
  ...enrollment,
  id: 'enrollment-2',
  learner: {
    id: 'learner-2',
    first_name: 'Bruno',
    last_name: 'Durand',
    email: 'bruno@example.com',
  },
  status: 'completed',
};
const summary: ApiDashboardEnrollmentsPage['meta']['summary'] = {
  total: 107,
  status_counts: { completed: 40, in_progress: 30, not_started: 20, failed: 10, expired: 7 },
};
const attempt: EnrollmentAttemptSummary = {
  id: 'attempt-1',
  attempt_number: 3,
  status: 'failed',
  available_at: '2026-09-01T09:00:00Z',
  started_at: '2026-09-02T09:00:00Z',
  ended_at: '2026-09-03T10:00:00Z',
  interruption_reason: null,
  time_spent_seconds: 61,
};

function page(
  data: ApiDashboardEnrollment[] = [enrollment, otherEnrollment],
  meta: Partial<ApiDashboardEnrollmentsPage['meta']> = {},
): ApiDashboardEnrollmentsPage {
  return {
    data,
    meta: {
      total: data.length,
      page: 1,
      per_page: 20,
      summary,
      formation: { duration_minutes: 60 },
      ...meta,
    },
  };
}

function history(id = enrollment.id, attempts = [attempt]): EnrollmentHistoryResponse {
  return {
    data: {
      enrollment: { id, learner_id: 'learner-1', learning_path_id: formation.id, status: 'failed' },
      attempts,
    },
    meta: { total: attempts.length, page: 1, per_page: 20 },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const clients: QueryClient[] = [];
function renderSheet(selection: FormationStudentSelection | null = { formation, status: null }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(client);
  const props = { onClose: jest.fn(), onRestoreFocus: jest.fn() };
  const view = render(<FormationStudentsSheet selection={selection} {...props} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>
    ),
  });
  return {
    ...view,
    client,
    changeSelection: (next: FormationStudentSelection | null) =>
      view.rerender(<FormationStudentsSheet selection={next} {...props} />),
  };
}

function table() {
  return screen.getByRole('table', { name: 'Étudiants concernés' });
}
function rows() {
  return within(table())
    .queryAllByRole('row')
    .filter((row) => within(row).queryAllByRole('cell').length === 8);
}
function searchBox() {
  return screen.getByRole('searchbox', { name: 'Rechercher un étudiant' });
}
function statusButton(name: RegExp) {
  return within(screen.getByRole('group', { name: 'Filtrer par statut' })).getByRole('button', {
    name,
  });
}
function studentButton(name = 'Alice Martin') {
  return screen.getByRole('button', { name: `Voir les tentatives de ${name}` });
}
function detailPane() {
  return screen.queryByRole('region', { name: 'Alice Martin' });
}

async function selectStudent() {
  const user = userEvent.setup();
  await screen.findByRole('button', { name: 'Voir les tentatives de Alice Martin' });
  await user.click(studentButton());
  await screen.findByRole('button', { name: /^Tentative 3/ });
  return user;
}

beforeEach(() => {
  jest.clearAllMocks();
  api.enrollments.mockReset().mockResolvedValue(page());
  historyApi.history.mockReset().mockImplementation(async (id) => history(id));
  historyApi.detail.mockReset().mockResolvedValue({ data: { attempt, nodes: [] } });
  useAuthStore.setState({
    user: { id: 'editor-1', name: 'Éditeur', email: 'editor@example.com', role: Role.EDITOR },
    role: Role.EDITOR,
    sessionId: 'session-1',
  });
  useTenantStore.setState({ tenant: null, resolutionStatus: 'resolved' });
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  useAuthStore.setState({ user: null, role: null, sessionId: null });
  useTenantStore.setState({ tenant: null, resolutionStatus: 'resolved' });
});

describe('panneau connecté aux inscriptions réelles', () => {
  it('ne demande ni inscriptions ni historique quand le panneau est fermé', () => {
    renderSheet(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.enrollments).not.toHaveBeenCalled();
    expect(historyApi.history).not.toHaveBeenCalled();
    expect(historyApi.detail).not.toHaveBeenCalled();
  });

  it('charge le statut initial et les compteurs globaux sans les déduire des lignes ni de la carte', async () => {
    api.enrollments.mockResolvedValue(page([enrollment], { total: 10 }));
    renderSheet({ formation, status: 'failed' });
    await screen.findByText('10 sur 107 inscriptions');
    expect(api.enrollments).toHaveBeenCalledWith(
      formation.id,
      expect.objectContaining({ status: 'failed', q: '', page: 1, per_page: 20 }),
      expect.any(AbortSignal),
    );
    expect(statusButton(/^Tous/)).toHaveTextContent('Tous (107)');
    expect(statusButton(/^Terminé/)).toHaveTextContent('Terminé (40)');
    expect(statusButton(/^En cours/)).toHaveTextContent('En cours (30)');
    expect(statusButton(/^Non commencé/)).toHaveTextContent('Non commencé (20)');
    expect(statusButton(/^Échoué/)).toHaveTextContent('Échoué (10)');
    expect(statusButton(/^Échoué/)).toHaveAttribute('aria-pressed', 'true');
    expect(statusButton(/^Expiré/)).toHaveTextContent('Expiré (7)');
    expect(rows()).toHaveLength(1);
    expect(screen.getByRole('dialog')).toHaveClass('data-[side=right]:min-w-full');
    expect(detailPane()).not.toBeInTheDocument();
    expect(studentButton()).not.toHaveAttribute('aria-controls');
    expect(historyApi.history).not.toHaveBeenCalled();
  });

  it('affiche les dates et secondes serveur sans inventer de critère de fin ni d’expiration globale', async () => {
    renderSheet();
    await screen.findByText('alice@example.com');
    const cells = within(rows()[0]).getAllByRole('cell');
    expect(
      within(table())
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual([
      'Étudiant',
      'Statut',
      'Début',
      'Fin',
      'Temps passé',
      'Tentatives',
      'Accès valable jusqu’au',
      'Détails',
    ]);
    expect(cells[1]).toHaveTextContent('Échoué');
    expect(cells[2].querySelector('time')).toHaveAttribute('datetime', enrollment.started_at);
    expect(cells[3].querySelector('time')).toHaveAttribute('datetime', enrollment.ended_at);
    expect(cells[4]).toHaveTextContent(/^1 min 1 s$/);
    expect(cells[5]).toHaveTextContent(/^3$/);
    expect(cells[6].querySelector('time')).toHaveAttribute('datetime', enrollment.expires_at);
    expect(cells[6]).toHaveTextContent('31/12/2026');
    expect(screen.getByText('Durée théorique').nextElementSibling).toHaveTextContent('1 h');
    expect(
      screen.queryByText(/Expiration de la formation|Critère de fin|Reprise depuis le début/),
    ).not.toBeInTheDocument();
    expect(cells[7].querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(within(rows()[0]).getAllByRole('button')).toHaveLength(1);
  });

  it.each([
    [59, 1, '59 s', 'text-emerald-600'],
    [60, 1, '1 min', 'text-red-600'],
    [61, 1, '1 min 1 s', 'text-red-600'],
    [0, 0, '0 s', 'text-muted-foreground'],
  ])(
    'compare exactement %i secondes au budget d’une minute (%i tentative)',
    async (seconds, attempts, text, color) => {
      api.enrollments.mockResolvedValue(
        page([{ ...enrollment, time_spent_seconds: seconds, attempts_count: attempts }], {
          formation: { duration_minutes: 1 },
        }),
      );
      renderSheet();
      await screen.findByText('alice@example.com');
      const cell = within(rows()[0]).getAllByRole('cell')[4];
      expect(cell.textContent).toBe(text);
      expect(cell).toHaveClass(color);
    },
  );

  it('ne colore pas le temps comme un dépassement quand la durée théorique est inconnue', async () => {
    api.enrollments.mockResolvedValue(
      page([{ ...enrollment, time_spent_seconds: 3661 }], {
        formation: { duration_minutes: null },
      }),
    );
    renderSheet();
    await screen.findByText('alice@example.com');
    const cell = within(rows()[0]).getAllByRole('cell')[4];
    expect(cell).toHaveTextContent(/^1 h 1 min 1 s$/);
    expect(cell).toHaveClass('text-muted-foreground');
    expect(cell).not.toHaveClass('text-red-600');
    expect(cell).not.toHaveClass('text-emerald-600');
    expect(screen.queryByText('Durée théorique')).not.toBeInTheDocument();
  });

  it('accepte les noms, e-mails et dates nuls et le statut expiré sans lien de contact fictif', async () => {
    api.enrollments.mockResolvedValue(
      page([
        {
          ...enrollment,
          learner: { id: 'learner-1', first_name: null, last_name: null, email: null },
          status: 'expired',
          started_at: null,
          ended_at: null,
          expires_at: null,
          attempts_count: 0,
          time_spent_seconds: 0,
        },
      ]),
    );
    historyApi.history.mockResolvedValue(history(enrollment.id, []));
    const user = userEvent.setup();
    renderSheet({ formation, status: 'expired' });
    await screen.findByText('Étudiant indisponible');
    const cells = within(rows()[0]).getAllByRole('cell');
    expect(cells[1]).toHaveTextContent('Expiré');
    expect(cells[2]).toHaveTextContent('Non démarré');
    expect(cells[3]).toHaveTextContent('—');
    expect(cells[4]).toHaveTextContent('0 s');
    expect(cells[5]).toHaveTextContent('0');
    expect(cells[6]).toHaveTextContent('Sans échéance');
    expect(table().querySelector('time')).not.toBeInTheDocument();
    await user.click(studentButton('Étudiant indisponible'));
    expect(await screen.findByText('Aucune tentative à afficher.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contacter l’étudiant' })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Étudiant indisponible' })).getByText(
        'E-mail indisponible',
      ),
    ).toBeInTheDocument();
    expect(historyApi.detail).not.toHaveBeenCalled();
  });

  it('charge l’historique à la sélection et les étapes seulement au dépliage clavier', async () => {
    const user = userEvent.setup();
    renderSheet();
    await screen.findByText('alice@example.com');
    const trigger = studentButton();
    trigger.focus();
    await user.keyboard('{Enter}');
    const attemptTrigger = await screen.findByRole('button', { name: /^Tentative 3/ });
    expect(historyApi.history).toHaveBeenCalledWith(enrollment.id, 1, expect.any(AbortSignal));
    expect(historyApi.detail).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-current', 'true');
    expect(trigger).toHaveAttribute('aria-controls', detailPane()!.id);
    expect(
      within(detailPane()!).getByRole('link', { name: 'Contacter l’étudiant' }),
    ).toHaveAttribute('href', 'mailto:alice@example.com');
    expect(attemptTrigger).toHaveTextContent('Temps passé : 1 min 1 s');
    expect(attemptTrigger).toHaveAttribute('aria-expanded', 'false');
    attemptTrigger.focus();
    await user.keyboard(' ');
    await waitFor(() =>
      expect(historyApi.detail).toHaveBeenCalledWith(
        enrollment.id,
        attempt.id,
        expect.any(AbortSignal),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Replier' }));
    expect(detailPane()).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-current', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
    expect(rows()).toHaveLength(2);
  });

  it('conserve deux inscriptions du même étudiant sans mention de réinscription et réinitialise leur tentative ouverte', async () => {
    const reenrollment = {
      ...enrollment,
      id: 'enrollment-repeat',
      status: 'completed' as const,
    };
    api.enrollments.mockResolvedValue(page([enrollment, reenrollment]));
    historyApi.history.mockImplementation(async (id) =>
      history(id, [
        { ...attempt, id: `attempt-${id}`, attempt_number: id === enrollment.id ? 3 : 1 },
      ]),
    );
    const user = userEvent.setup();
    renderSheet();
    expect(await screen.findAllByText('alice@example.com')).toHaveLength(2);
    const [first, second] = rows().map((row) => within(row).getByRole('button'));
    expect(table()).not.toHaveTextContent(/réinscription/i);
    await user.click(first);
    await user.click(await screen.findByRole('button', { name: /^Tentative 3/ }));
    await waitFor(() =>
      expect(historyApi.detail).toHaveBeenCalledWith(
        enrollment.id,
        `attempt-${enrollment.id}`,
        expect.any(AbortSignal),
      ),
    );
    // The whole row also opens history, not just the name button.
    await user.click(within(rows()[1]).getAllByRole('cell')[4]);
    expect(await screen.findByRole('button', { name: /^Tentative 1/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(historyApi.history).toHaveBeenLastCalledWith(
      reenrollment.id,
      1,
      expect.any(AbortSignal),
    );
    expect(first).toHaveAttribute('aria-current', 'false');
    expect(second).toHaveAttribute('aria-current', 'true');
    expect(screen.queryByRole('button', { name: /^Tentative 3/ })).not.toBeInTheDocument();
    expect(historyApi.detail).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: /^Tentative 1/ }));
    await waitFor(() =>
      expect(historyApi.detail).toHaveBeenLastCalledWith(
        reenrollment.id,
        `attempt-${reenrollment.id}`,
        expect.any(AbortSignal),
      ),
    );
  });
});

describe('filtres et pagination côté serveur', () => {
  it('envoie la recherche débouncée au serveur et affiche sa réponse, pas un sous-ensemble de la page visible', async () => {
    api.enrollments.mockImplementation(async (_id, params = {}) =>
      params.q ? page([otherEnrollment], { total: 31 }) : page([enrollment], { total: 107 }),
    );
    renderSheet();
    await screen.findByText('alice@example.com');
    fireEvent.change(searchBox(), { target: { value: '  ALIAS_SERVEUR  ' } });
    await screen.findByText('bruno@example.com');
    expect(api.enrollments).toHaveBeenLastCalledWith(
      formation.id,
      expect.objectContaining({ q: 'ALIAS_SERVEUR', page: 1, per_page: 20 }),
      expect.any(AbortSignal),
    );
    // The server may match aliases; the client must not apply its own name/email filter.
    expect(rows()).toHaveLength(1);
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('31 sur 107 inscriptions')).toBeInTheDocument();
    expect(statusButton(/^Terminé/)).toHaveTextContent('(40)');
    expect(historyApi.history).not.toHaveBeenCalled();
  });

  it('pagine avec les métadonnées serveur et ne demande jamais une page 2 avec un nouveau statut ou texte', async () => {
    api.enrollments.mockImplementation(async (_id, params = {}) =>
      page(params.page === 2 ? [otherEnrollment] : [enrollment], {
        total: 21,
        page: params.page ?? 1,
      }),
    );
    const user = userEvent.setup();
    renderSheet();
    await screen.findByText('Page 1 sur 2');
    expect(screen.getByRole('button', { name: 'Inscriptions précédentes' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Inscriptions suivantes' }));
    await screen.findByText('bruno@example.com');
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
    expect(api.enrollments).toHaveBeenLastCalledWith(
      formation.id,
      expect.objectContaining({ page: 2, per_page: 20 }),
      expect.any(AbortSignal),
    );
    expect(screen.getByRole('button', { name: 'Inscriptions suivantes' })).toBeDisabled();
    await user.click(statusButton(/^Expiré/));
    await screen.findByText('alice@example.com');
    expect(api.enrollments).toHaveBeenLastCalledWith(
      formation.id,
      expect.objectContaining({ status: 'expired', page: 1 }),
      expect.any(AbortSignal),
    );
    await user.click(screen.getByRole('button', { name: 'Inscriptions suivantes' }));
    await screen.findByText('bruno@example.com');
    fireEvent.change(searchBox(), { target: { value: 'nouveau' } });
    await waitFor(() =>
      expect(api.enrollments).toHaveBeenLastCalledWith(
        formation.id,
        expect.objectContaining({ status: 'expired', q: 'nouveau', page: 1 }),
        expect.any(AbortSignal),
      ),
    );
    // Inspect calls in order: applying the status first requests page 1, not page 2.
    expect(
      api.enrollments.mock.calls.find(([, params]) => params?.status === 'expired')?.[1]?.page,
    ).toBe(1);
    expect(
      api.enrollments.mock.calls.some(([, params]) => params?.q === 'nouveau' && params.page !== 1),
    ).toBe(false);
  });

  it.each([
    ['Début', 'started_at_from', 'started_at_to'],
    ['Fin', 'ended_at_from', 'ended_at_to'],
    ['Accès valable jusqu’au', 'expires_at_from', 'expires_at_to'],
  ] as const)(
    'applique les bornes %s au serveur avant la pagination, jamais au seul tableau visible',
    async (label, from, to) => {
      api.enrollments.mockImplementation(async (_id, params = {}) =>
        page([params[from] ? otherEnrollment : enrollment], { total: 21, page: params.page ?? 1 }),
      );
      const user = userEvent.setup();
      renderSheet();
      await screen.findByText('alice@example.com');
      await user.click(screen.getByRole('button', { name: 'Inscriptions suivantes' }));
      await waitFor(() => expect(table()).toHaveAttribute('aria-busy', 'false'));
      const requests = api.enrollments.mock.calls.length;
      await user.click(screen.getByRole('button', { name: `Filtrer par ${label}` }));
      await user.click(screen.getByRole('button', { name: 'Choisir une plage' }));
      expect(api.enrollments).toHaveBeenCalledTimes(requests);
      await user.click(screen.getByRole('button', { name: 'Appliquer' }));
      await screen.findByText('bruno@example.com');
      expect(api.enrollments).toHaveBeenLastCalledWith(
        formation.id,
        expect.objectContaining({
          [from]: '2026-09-02',
          [to]: '2026-09-28',
          page: 1,
          per_page: 20,
        }),
        expect.any(AbortSignal),
      );
      expect(
        api.enrollments.mock.calls.some(([, params]) => params?.[from] && params.page !== 1),
      ).toBe(false);
      // In particular the expires_at date is outside the selected range: trust the API response.
      expect(rows()).toHaveLength(1);
      expect(screen.getByText('21 sur 107 inscriptions')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: `Filtrer par ${label} — filtre actif` }));
      await user.click(screen.getByRole('button', { name: 'Réinitialiser' }));
      await screen.findByText('alice@example.com');
      expect(screen.getByRole('button', { name: `Filtrer par ${label}` })).toBeInTheDocument();
    },
  );

  it('combine toutes les dates avec le statut et la recherche puis réinitialise les filtres', async () => {
    api.enrollments.mockImplementation(async (_id, params = {}) =>
      page(params.expires_at_to ? [] : [enrollment]),
    );
    const user = userEvent.setup();
    renderSheet({ formation, status: 'failed' });
    await screen.findByText('alice@example.com');
    fireEvent.change(searchBox(), { target: { value: '  Alice  ' } });
    await waitFor(() =>
      expect(api.enrollments).toHaveBeenLastCalledWith(
        formation.id,
        expect.objectContaining({ q: 'Alice' }),
        expect.any(AbortSignal),
      ),
    );
    for (const label of ['Début', 'Fin', 'Accès valable jusqu’au']) {
      await user.click(screen.getByRole('button', { name: `Filtrer par ${label}` }));
      await user.click(screen.getByRole('button', { name: 'Choisir une plage' }));
      await user.click(screen.getByRole('button', { name: 'Appliquer' }));
    }
    expect(
      await screen.findByText('Aucun étudiant ne correspond aux filtres.'),
    ).toBeInTheDocument();
    expect(api.enrollments).toHaveBeenLastCalledWith(
      formation.id,
      {
        status: 'failed',
        q: 'Alice',
        page: 1,
        per_page: 20,
        started_at_from: '2026-09-02',
        started_at_to: '2026-09-28',
        ended_at_from: '2026-09-02',
        ended_at_to: '2026-09-28',
        expires_at_from: '2026-09-02',
        expires_at_to: '2026-09-28',
      },
      expect.any(AbortSignal),
    );
    await user.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    await waitFor(() =>
      expect(api.enrollments).toHaveBeenLastCalledWith(
        formation.id,
        {
          status: undefined,
          q: '',
          page: 1,
          per_page: 20,
          started_at_from: undefined,
          started_at_to: undefined,
          ended_at_from: undefined,
          ended_at_to: undefined,
          expires_at_from: undefined,
          expires_at_to: undefined,
        },
        expect.any(AbortSignal),
      ),
    );
    expect(searchBox()).toHaveValue('');
    expect(statusButton(/^Tous/)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Aucun étudiant ne correspond aux filtres.')).not.toBeInTheDocument();
  });

  it.each([
    ['Choisir la borne inférieure', { started_at_from: '2026-09-02', started_at_to: undefined }],
    ['Choisir la borne supérieure', { started_at_from: undefined, started_at_to: '2026-09-28' }],
  ])('transmet une plage ouverte : %s', async (choice, bounds) => {
    const user = userEvent.setup();
    renderSheet();
    await screen.findByText('alice@example.com');
    await user.click(screen.getByRole('button', { name: 'Filtrer par Début' }));
    await user.click(screen.getByRole('button', { name: choice }));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));
    await waitFor(() =>
      expect(api.enrollments).toHaveBeenLastCalledWith(
        formation.id,
        expect.objectContaining(bounds),
        expect.any(AbortSignal),
      ),
    );
  });

  it('conserve le détail à travers recherche, statut, dates et page puis rend le focus à la recherche si la ligne a disparu', async () => {
    api.enrollments.mockImplementation(async (_id, params = {}) =>
      page(params.q || params.status || params.page === 2 ? [otherEnrollment] : [enrollment], {
        total: 21,
        page: params.page ?? 1,
      }),
    );
    renderSheet();
    const user = await selectStudent();
    fireEvent.change(searchBox(), { target: { value: 'Bruno' } });
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Voir les tentatives de Alice Martin' }),
      ).not.toBeInTheDocument(),
    );
    expect(detailPane()).toBeInTheDocument();
    await user.click(statusButton(/^Terminé/));
    await waitFor(() => expect(table()).toHaveAttribute('aria-busy', 'false'));
    await user.click(screen.getByRole('button', { name: 'Filtrer par Fin' }));
    await user.click(screen.getByRole('button', { name: 'Choisir une plage' }));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));
    await waitFor(() => expect(table()).toHaveAttribute('aria-busy', 'false'));
    await user.click(screen.getByRole('button', { name: 'Inscriptions suivantes' }));
    await screen.findByText('Page 2 sur 2');
    expect(detailPane()).toBeInTheDocument();
    expect(historyApi.history).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Replier' }));
    expect(detailPane()).not.toBeInTheDocument();
    expect(searchBox()).toHaveFocus();
  });
});

describe('chargement, erreurs et isolation', () => {
  it('annonce le chargement initial sans fabriquer une liste vide ou des totaux', async () => {
    const pending = deferred<ApiDashboardEnrollmentsPage>();
    api.enrollments.mockReturnValue(pending.promise);
    renderSheet();
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des inscriptions…');
    expect(table()).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText(/Aucun étudiant/)).not.toBeInTheDocument();
    expect(statusButton(/^Tous/)).toHaveTextContent('Tous ()');
    expect(statusButton(/^Tous/).querySelector('.animate-spin')).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
    await act(async () => pending.resolve(page()));
    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
  });

  it('masque la page précédente pendant le chargement et bloque les boutons de pagination', async () => {
    const pending = deferred<ApiDashboardEnrollmentsPage>();
    api.enrollments
      .mockResolvedValueOnce(page([enrollment], { total: 21 }))
      .mockReturnValueOnce(pending.promise);
    const user = userEvent.setup();
    renderSheet();
    await screen.findByText('alice@example.com');
    await user.click(screen.getByRole('button', { name: 'Inscriptions suivantes' }));
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText(/Aucun étudiant/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inscriptions suivantes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Inscriptions précédentes' })).toBeDisabled();
    await act(async () => pending.resolve(page([otherEnrollment], { total: 21, page: 2 })));
    expect(await screen.findByText('bruno@example.com')).toBeInTheDocument();
  });

  it('distingue erreur et vide, et permet une nouvelle tentative', async () => {
    api.enrollments.mockRejectedValueOnce(new Error('indisponible'));
    const user = userEvent.setup();
    renderSheet();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger les inscriptions.',
    );
    expect(screen.queryByText(/Aucun étudiant/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réessayer les inscriptions' }));
    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
    expect(api.enrollments).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('annonce un effectif réellement vide depuis le résumé serveur', async () => {
    api.enrollments.mockResolvedValue(page([], { summary: { total: 0, status_counts: {} } }));
    renderSheet();
    expect(
      await screen.findByText('Aucun étudiant inscrit à cette formation.'),
    ).toBeInTheDocument();
    expect(screen.getByText('0 sur 0 inscriptions')).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
    expect(
      screen.queryByRole('navigation', { name: 'Pagination des inscriptions' }),
    ).not.toBeInTheDocument();
    expect(historyApi.history).not.toHaveBeenCalled();
  });

  it('gère le chargement et la nouvelle tentative de l’historique sans recharger les inscriptions', async () => {
    historyApi.history.mockRejectedValueOnce(new Error('historique indisponible'));
    const pending = deferred<EnrollmentHistoryResponse>();
    historyApi.history.mockReturnValueOnce(pending.promise);
    const user = userEvent.setup();
    renderSheet();
    await screen.findByText('alice@example.com');
    await user.click(studentButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger l’historique',
    );
    await user.click(screen.getByRole('button', { name: 'Réessayer l’historique' }));
    expect(
      await screen.findByText('Chargement de l’historique des tentatives…'),
    ).toBeInTheDocument();
    await act(async () => pending.resolve(history()));
    expect(await screen.findByRole('button', { name: /^Tentative 3/ })).toBeInTheDocument();
    expect(api.enrollments).toHaveBeenCalledTimes(1);
    expect(historyApi.history).toHaveBeenCalledTimes(2);
    expect(historyApi.detail).not.toHaveBeenCalled();
  });

  it.each(['formation', 'statut'] as const)(
    'réinitialise sélection, page, recherche et dates au changement de %s',
    async (change) => {
      api.enrollments.mockImplementation(async (_id, params = {}) =>
        page([enrollment], { total: 21, page: params.page ?? 1 }),
      );
      const { changeSelection } = renderSheet();
      const user = await selectStudent();
      fireEvent.change(searchBox(), { target: { value: 'Alice' } });
      await waitFor(() =>
        expect(api.enrollments).toHaveBeenLastCalledWith(
          formation.id,
          expect.objectContaining({ q: 'Alice' }),
          expect.any(AbortSignal),
        ),
      );
      await user.click(screen.getByRole('button', { name: 'Filtrer par Début' }));
      await user.click(screen.getByRole('button', { name: 'Choisir une plage' }));
      await user.click(screen.getByRole('button', { name: 'Appliquer' }));
      await waitFor(() => expect(table()).toHaveAttribute('aria-busy', 'false'));
      await user.click(screen.getByRole('button', { name: 'Inscriptions suivantes' }));
      await screen.findByText('Page 2 sur 2');
      const next = {
        formation:
          change === 'formation'
            ? { ...formation, id: 'formation-2', name: 'Autre formation' }
            : formation,
        status: change === 'statut' ? ('expired' as const) : null,
      };
      api.enrollments.mockReturnValue(new Promise(() => {}));
      changeSelection(next);
      expect(detailPane()).not.toBeInTheDocument();
      expect(searchBox()).toHaveValue('');
      expect(screen.getByRole('button', { name: 'Filtrer par Début' })).toBeInTheDocument();
      expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
      await waitFor(() =>
        expect(api.enrollments).toHaveBeenLastCalledWith(
          next.formation.id,
          expect.objectContaining({
            q: '',
            page: 1,
            status: next.status ?? undefined,
            started_at_from: undefined,
            started_at_to: undefined,
          }),
          expect.any(AbortSignal),
        ),
      );
      expect(historyApi.history).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['identité', 'session', 'tenant'] as const)(
    'ne réutilise ni sélection ni données en changeant de %s, même avec un cache conservé',
    async (scope) => {
      renderSheet();
      await selectStudent();
      api.enrollments.mockReturnValue(new Promise(() => {}));
      act(() => {
        if (scope === 'identité')
          useAuthStore.setState({
            user: {
              id: 'editor-2',
              name: 'Autre éditeur',
              email: 'other@example.com',
              role: Role.EDITOR,
            },
          });
        else if (scope === 'session') useAuthStore.setState({ sessionId: 'session-2' });
        else
          useTenantStore.setState({
            tenant: { id: 'tenant-2' } as NonNullable<
              ReturnType<typeof useTenantStore.getState>['tenant']
            >,
          });
      });
      expect(detailPane()).not.toBeInTheDocument();
      expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Tentative 3/ })).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Chargement des inscriptions');
      await waitFor(() => expect(api.enrollments).toHaveBeenCalledTimes(2));
      expect(historyApi.history).toHaveBeenCalledTimes(1);
    },
  );

  it('ferme le panneau et ne lance plus de requêtes après déconnexion', async () => {
    renderSheet();
    await selectStudent();
    act(() => useAuthStore.setState({ user: null, role: null, sessionId: null }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
    expect(api.enrollments).toHaveBeenCalledTimes(1);
    expect(historyApi.history).toHaveBeenCalledTimes(1);
  });

  it('ouvre au clavier, ferme avec Échap et restitue le focus sans garder de sélection à la réouverture', async () => {
    function Harness() {
      const trigger = useRef<HTMLButtonElement>(null);
      const [selection, setSelection] = useState<FormationStudentSelection | null>(null);
      return (
        <>
          <button ref={trigger} onClick={() => setSelection({ formation, status: null })}>
            Ouvrir
          </button>
          <FormationStudentsSheet
            selection={selection}
            onClose={() => setSelection(null)}
            onRestoreFocus={() => trigger.current?.focus()}
          />
        </>
      );
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    clients.push(client);
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <Harness />
        </TooltipProvider>
      </QueryClientProvider>,
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await selectStudent();
    await user.click(screen.getByRole('button', { name: /^Tentative 3/ }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await screen.findByText('alice@example.com');
    expect(detailPane()).not.toBeInTheDocument();
    expect(studentButton()).toHaveAttribute('aria-current', 'false');
    expect(historyApi.history).toHaveBeenCalledTimes(1);
    expect(historyApi.detail).toHaveBeenCalledTimes(1);
  });
});
