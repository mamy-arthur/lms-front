import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { keepPreviousData, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { enrollmentHistoryApi } from '@/shared/api/enrollment-history.api';
import {
  useEnrollmentAttemptDetailQuery,
  useEnrollmentHistoryQuery,
} from '../useEnrollmentHistoryQuery';
import type {
  EnrollmentAttemptDetailResponse,
  EnrollmentHistoryResponse,
} from '@/shared/types/enrollment-history.types';

jest.mock('@/shared/api/enrollment-history.api', () => ({
  enrollmentHistoryApi: { history: jest.fn(), detail: jest.fn() },
}));
const api = jest.mocked(enrollmentHistoryApi);
const history: EnrollmentHistoryResponse = {
  data: {
    enrollment: {
      id: 'enrollment-1',
      learner_id: 'learner-1',
      learning_path_id: 'path-1',
      status: 'in_progress',
    },
    attempts: [
      {
        id: 'attempt-1',
        attempt_number: 1,
        status: 'in_progress',
        available_at: '2026-09-01T09:00:00Z',
        started_at: null,
        ended_at: null,
        interruption_reason: null,
        time_spent_seconds: 0,
      },
    ],
  },
  meta: { total: 1, page: 1, per_page: 20 },
};
const detail: EnrollmentAttemptDetailResponse = {
  data: { attempt: history.data.attempts[0], nodes: [] },
};
const clients: QueryClient[] = [];

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, placeholderData: keepPreviousData } },
  });
  clients.push(client);
  return function TestProvider({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
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
  useTenantStore.setState({ tenant: null });
});

it.each([Role.EDITOR, Role.SUPER_ADMIN, Role.CLIENT_MANAGER, Role.TRAINEE])(
  'autorise le rôle API %s',
  async (role) => {
    useAuthStore.setState({ role });
    const { result } = renderHook(() => useEnrollmentHistoryQuery('enrollment-1'), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.history).toHaveBeenCalledWith('enrollment-1', 1, expect.any(AbortSignal));
  },
);

it.each(['', ' ', '../other', 'id/other', 'id?query', ' id '])(
  'ne demande jamais un identifiant invalide %j',
  (id) => {
    const { result } = renderHook(
      () => ({
        list: useEnrollmentHistoryQuery(id),
        detail: useEnrollmentAttemptDetailQuery(id, 'attempt-1', true),
      }),
      { wrapper: wrapper() },
    );
    expect(result.current.list.enabled).toBe(false);
    expect(result.current.detail.enabled).toBe(false);
    expect(api.history).not.toHaveBeenCalled();
    expect(api.detail).not.toHaveBeenCalled();
  },
);

it.each([null, undefined] as const)(
  'bloque les requêtes sans identité ou rôle autorisé (%s)',
  (missing) => {
    if (missing === null) useAuthStore.setState({ user: null });
    else useAuthStore.setState({ role: null });
    const { result } = renderHook(
      () => ({
        list: useEnrollmentHistoryQuery('enrollment-1'),
        detail: useEnrollmentAttemptDetailQuery('enrollment-1', 'attempt-1', true),
      }),
      { wrapper: wrapper() },
    );
    expect(result.current.list.enabled).toBe(false);
    expect(result.current.detail.enabled).toBe(false);
    expect(api.history).not.toHaveBeenCalled();
    expect(api.detail).not.toHaveBeenCalled();
  },
);

it('charge le détail seulement après expansion et valide aussi l’identifiant de tentative', async () => {
  const { result, rerender } = renderHook(
    ({ id, expanded }) => useEnrollmentAttemptDetailQuery('enrollment-1', id, expanded),
    {
      initialProps: { id: 'attempt-1', expanded: false },
      wrapper: wrapper(),
    },
  );
  expect(api.detail).not.toHaveBeenCalled();
  rerender({ id: '', expanded: true });
  expect(result.current.enabled).toBe(false);
  expect(api.detail).not.toHaveBeenCalled();
  rerender({ id: 'attempt-1', expanded: true });
  await waitFor(() => expect(result.current.data).toEqual(detail.data));
  expect(api.detail).toHaveBeenCalledWith('enrollment-1', 'attempt-1', expect.any(AbortSignal));
  rerender({ id: 'attempt-2', expanded: false });
  expect(result.current.data).toBeUndefined();
  expect(api.detail).toHaveBeenCalledTimes(1);
});

const scopeChanges: Array<[string, () => void]> = [
  [
    'utilisateur',
    () =>
      useAuthStore.setState({
        user: { id: 'editor-2', name: 'Autre', email: 'other@example.com', role: Role.EDITOR },
      }),
  ],
  ['session', () => useAuthStore.setState({ sessionId: 'session-2' })],
  ['rôle', () => useAuthStore.setState({ role: Role.SUPER_ADMIN })],
  [
    'tenant',
    () =>
      useTenantStore.setState({
        tenant: {
          id: 'tenant-2',
          slug: 'second',
          name: 'Second',
          domain: 'second.test',
          status: 'active',
          is_active: true,
          features: { certificates: false, liveSession: false, customDomain: false },
        },
      }),
  ],
];

it.each<[string, (() => void) | null]>([['démontage', null], ...scopeChanges])(
  'annule les requêtes de liste et de détail en attente : %s',
  async (_name, changeScope) => {
    api.history.mockReturnValue(new Promise(() => {}));
    api.detail.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(
      () => ({
        list: useEnrollmentHistoryQuery('enrollment-1'),
        detail: useEnrollmentAttemptDetailQuery('enrollment-1', 'attempt-1', true),
      }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(api.history).toHaveBeenCalledTimes(1));
    expect(api.detail).toHaveBeenCalledTimes(1);
    const signals = [api.history.mock.calls[0][2], api.detail.mock.calls[0][2]];
    const onAbort = jest.fn();
    signals.forEach((signal) => {
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal?.aborted).toBe(false);
      signal?.addEventListener('abort', onAbort, { once: true });
    });

    if (changeScope) act(changeScope);
    else unmount();

    signals.forEach((signal) => expect(signal?.aborted).toBe(true));
    expect(onAbort).toHaveBeenCalledTimes(2);
    if (changeScope) {
      await waitFor(() => expect(api.history).toHaveBeenCalledTimes(2));
      expect(api.detail).toHaveBeenCalledTimes(2);
      const nextSignals = [api.history.mock.calls[1][2], api.detail.mock.calls[1][2]];
      nextSignals.forEach((signal, index) => {
        expect(signal).not.toBe(signals[index]);
        expect(signal?.aborted).toBe(false);
      });
    } else {
      expect(api.history).toHaveBeenCalledTimes(1);
      expect(api.detail).toHaveBeenCalledTimes(1);
    }
  },
);

it.each(scopeChanges)(
  'isole listes et détails quand le contexte %s change, même avec keepPreviousData global',
  async (_name, changeScope) => {
    const { result } = renderHook(
      () => ({
        list: useEnrollmentHistoryQuery('enrollment-1'),
        detail: useEnrollmentAttemptDetailQuery('enrollment-1', 'attempt-1', true),
      }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.list.data).toEqual(history));
    await waitFor(() => expect(result.current.detail.data).toEqual(detail.data));
    api.history.mockReturnValue(new Promise(() => {}));
    api.detail.mockReturnValue(new Promise(() => {}));
    act(changeScope);
    expect(result.current.list.data).toBeUndefined();
    expect(result.current.detail.data).toBeUndefined();
    await waitFor(() => expect(api.history).toHaveBeenCalledTimes(2));
    expect(api.detail).toHaveBeenCalledTimes(2);
  },
);

it('isole les inscriptions et les pages sans réutiliser un placeholder', async () => {
  const { result, rerender } = renderHook(({ id, page }) => useEnrollmentHistoryQuery(id, page), {
    initialProps: { id: 'enrollment-1', page: 1 },
    wrapper: wrapper(),
  });
  await waitFor(() => expect(result.current.data).toEqual(history));
  api.history.mockReturnValue(new Promise(() => {}));
  rerender({ id: 'enrollment-1', page: 2 });
  expect(result.current.data).toBeUndefined();
  expect(api.history).toHaveBeenLastCalledWith('enrollment-1', 2, expect.any(AbortSignal));
  rerender({ id: 'enrollment-2', page: 1 });
  expect(result.current.data).toBeUndefined();
  expect(api.history).toHaveBeenLastCalledWith('enrollment-2', 1, expect.any(AbortSignal));
});

it('expose une erreur réessayable sans la normaliser en historique vide', async () => {
  api.history.mockRejectedValueOnce(new Error('indisponible'));
  const { result } = renderHook(() => useEnrollmentHistoryQuery('enrollment-1'), {
    wrapper: wrapper(),
  });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.data).toBeUndefined();
  await act(async () => {
    await result.current.refetch();
  });
  await waitFor(() => expect(result.current.data).toEqual(history));
});
