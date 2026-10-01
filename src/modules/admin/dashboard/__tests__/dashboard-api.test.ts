import { apiGet } from '@/shared/lib/apiClient';
import type {
  ApiDashboardEnrollmentsPage,
  DashboardEnrollmentsParams,
} from '@/shared/types/dashboard.types';
import { editorDashboardApi } from '../api';

jest.mock('@/shared/lib/apiClient', () => ({ apiGet: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it('appelle la synthèse éditeur dans le groupe platform, sans identifiant de gestionnaire', async () => {
  await editorDashboardApi.overview();
  expect(apiGet).toHaveBeenCalledWith('platform/dashboard/overview', undefined, {
    signal: undefined,
  });
});

it('transmet les filtres et la pagination au serveur', async () => {
  const params = { q: 'Sécurité', sort_by: 'completion' as const, page: 2, per_page: 20 };
  await editorDashboardApi.formations(params);
  expect(apiGet).toHaveBeenCalledWith('platform/dashboard/formations', params, {
    signal: undefined,
  });
});

it('consulte les inscriptions selon le statut et la page demandés', async () => {
  await editorDashboardApi.enrollments('formation-id', { status: 'expired', page: 2 });
  expect(apiGet).toHaveBeenCalledWith(
    'platform/dashboard/formations/formation-id/enrollments',
    { status: 'expired', page: 2 },
    { signal: undefined },
  );
});

it('transmet tous les filtres d’inscription ensemble sans les supprimer ou les recalculer', async () => {
  const params: DashboardEnrollmentsParams = {
    status: 'expired',
    q: 'Élodie@example.com',
    page: 3,
    per_page: 50,
    started_at_from: '2026-01-01',
    started_at_to: '2026-02-28',
    ended_at_from: '2026-03-01',
    ended_at_to: '2026-04-30',
    expires_at_from: '2026-05-01',
    expires_at_to: '2026-06-30',
  };
  const response: ApiDashboardEnrollmentsPage = {
    data: [],
    meta: {
      total: 0,
      page: 3,
      per_page: 50,
      summary: { total: 107, status_counts: { expired: 7 } },
      formation: { duration_minutes: null },
    },
  };
  jest.mocked(apiGet).mockResolvedValueOnce(response);
  const result = await editorDashboardApi.enrollments('formation-real', params);
  expect(apiGet).toHaveBeenCalledTimes(1);
  expect(apiGet).toHaveBeenCalledWith(
    'platform/dashboard/formations/formation-real/enrollments',
    params,
    { signal: undefined },
  );
  expect(result).toBe(response);
});

it('ouvre toutes les inscriptions sans imposer de statut ou de filtre de date', async () => {
  await editorDashboardApi.enrollments('formation-id');
  expect(apiGet).toHaveBeenCalledWith(
    'platform/dashboard/formations/formation-id/enrollments',
    {},
    { signal: undefined },
  );
});

it.each([
  { started_at_from: '2026-09-02' },
  { ended_at_to: '2026-09-28' },
  { expires_at_from: '2026-09-02' },
])('transmet une borne ouverte sans inventer l’autre : %j', async (params) => {
  await editorDashboardApi.enrollments('formation-id', params);
  expect(apiGet).toHaveBeenCalledWith(
    'platform/dashboard/formations/formation-id/enrollments',
    params,
    { signal: undefined },
  );
});

it('transmet le même signal d’annulation aux trois appels HTTP', async () => {
  const { signal } = new AbortController();
  const params = { page: 2, per_page: 20, sort_by: 'enrolled' as const };
  await editorDashboardApi.overview(signal);
  await editorDashboardApi.formations(params, signal);
  await editorDashboardApi.enrollments('formation-id', params, signal);
  expect(apiGet).toHaveBeenNthCalledWith(1, 'platform/dashboard/overview', undefined, { signal });
  expect(apiGet).toHaveBeenNthCalledWith(2, 'platform/dashboard/formations', params, { signal });
  expect(apiGet).toHaveBeenNthCalledWith(
    3,
    'platform/dashboard/formations/formation-id/enrollments',
    params,
    { signal },
  );
  jest.mocked(apiGet).mock.calls.forEach(([, , options]) => expect(options?.signal).toBe(signal));
});

it('encode l’identifiant de formation comme un seul segment de chemin', async () => {
  await editorDashboardApi.enrollments('formation/1?status=failed#fragment');
  expect(apiGet).toHaveBeenCalledWith(
    'platform/dashboard/formations/formation%2F1%3Fstatus%3Dfailed%23fragment/enrollments',
    {},
    { signal: undefined },
  );
});
