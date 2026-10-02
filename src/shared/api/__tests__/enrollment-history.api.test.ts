import { apiGet } from '@/shared/lib/apiClient';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { enrollmentHistoryApi } from '../enrollment-history.api';
import type {
  EnrollmentHistoryResponse,
  EnrollmentAttemptDetailResponse,
} from '@/shared/types/enrollment-history.types';

jest.mock('@/shared/lib/apiClient', () => ({ apiGet: jest.fn() }));
beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ role: Role.TRAINEE });
});
afterEach(() => useAuthStore.setState({ role: null }));

const history: EnrollmentHistoryResponse = {
  data: {
    enrollment: {
      id: 'enrollment-1',
      learner_id: 'learner-1',
      learning_path_id: 'path-1',
      status: 'not_started',
    },
    attempts: [],
  },
  meta: { total: 0, page: 1, per_page: 20 },
};

it('charge uniquement la page demandée avec 20 tentatives par page', async () => {
  jest.mocked(apiGet).mockResolvedValue(history);
  expect(await enrollmentHistoryApi.history('enrollment-1')).toBe(history);
  expect(apiGet).toHaveBeenLastCalledWith(
    'enrollments/enrollment-1/history',
    { page: 1, per_page: 20 },
    { signal: undefined },
  );
  await enrollmentHistoryApi.history('enrollment-1', 3);
  expect(apiGet).toHaveBeenLastCalledWith(
    'enrollments/enrollment-1/history',
    { page: 3, per_page: 20 },
    { signal: undefined },
  );
});

it('charge un détail sans transformer les titres figés ni les temps reçus', async () => {
  const detail: EnrollmentAttemptDetailResponse = {
    data: {
      attempt: {
        id: 'attempt-1',
        attempt_number: 1,
        status: 'in_progress',
        available_at: '2026-09-01T09:00:00Z',
        started_at: null,
        ended_at: null,
        interruption_reason: null,
        time_spent_seconds: 0,
      },
      nodes: [],
    },
  };
  jest.mocked(apiGet).mockResolvedValue(detail);
  expect(await enrollmentHistoryApi.detail('enrollment-1', 'attempt-1')).toBe(detail);
  expect(apiGet).toHaveBeenCalledWith(
    'enrollments/enrollment-1/history/attempts/attempt-1',
    undefined,
    { signal: undefined },
  );
});

it('encode les identifiants et propage les erreurs sans fabriquer une liste vide', async () => {
  await enrollmentHistoryApi.detail('id/1', 'attempt?1');
  expect(apiGet).toHaveBeenCalledWith(
    'enrollments/id%2F1/history/attempts/attempt%3F1',
    undefined,
    { signal: undefined },
  );
  const error = new Error('Accès refusé');
  jest.mocked(apiGet).mockRejectedValue(error);
  await expect(enrollmentHistoryApi.history('enrollment-1')).rejects.toBe(error);
  await expect(enrollmentHistoryApi.detail('enrollment-1', 'attempt-1')).rejects.toBe(error);
});

it.each([Role.EDITOR, Role.SUPER_ADMIN])(
  'utilise les routes platform pour le rôle %s',
  async (role) => {
    useAuthStore.setState({ role });
    await enrollmentHistoryApi.history('enrollment-1');
    expect(apiGet).toHaveBeenLastCalledWith(
      'platform/enrollments/enrollment-1/history',
      { page: 1, per_page: 20 },
      { signal: undefined },
    );
    await enrollmentHistoryApi.detail('enrollment-1', 'attempt-1');
    expect(apiGet).toHaveBeenLastCalledWith(
      'platform/enrollments/enrollment-1/history/attempts/attempt-1',
      undefined,
      { signal: undefined },
    );
  },
);

it('conserve la route tenant pour le gestionnaire', async () => {
  useAuthStore.setState({ role: Role.CLIENT_MANAGER });
  await enrollmentHistoryApi.history('enrollment-1');
  expect(apiGet).toHaveBeenLastCalledWith(
    'enrollments/enrollment-1/history',
    { page: 1, per_page: 20 },
    { signal: undefined },
  );
});

it.each([Role.EDITOR, Role.SUPER_ADMIN, Role.CLIENT_MANAGER, Role.TRAINEE])(
  'transmet le signal d’annulation de la liste et du détail pour le rôle %s',
  async (role) => {
    useAuthStore.setState({ role });
    const { signal } = new AbortController();
    const prefix = role === Role.EDITOR || role === Role.SUPER_ADMIN ? 'platform/' : '';
    await enrollmentHistoryApi.history('enrollment-1', 2, signal);
    expect(apiGet).toHaveBeenLastCalledWith(
      `${prefix}enrollments/enrollment-1/history`,
      { page: 2, per_page: 20 },
      { signal },
    );
    expect(jest.mocked(apiGet).mock.calls[0][2]?.signal).toBe(signal);
    await enrollmentHistoryApi.detail('enrollment-1', 'attempt-1', signal);
    expect(apiGet).toHaveBeenLastCalledWith(
      `${prefix}enrollments/enrollment-1/history/attempts/attempt-1`,
      undefined,
      { signal },
    );
    expect(jest.mocked(apiGet).mock.calls[1][2]?.signal).toBe(signal);
  },
);
