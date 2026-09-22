import { apiGet } from '@/shared/lib/apiClient';
import { editorDashboardApi } from '../api';

jest.mock('@/shared/lib/apiClient', () => ({ apiGet: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it('appelle la synthèse éditeur dans le groupe platform, sans identifiant de gestionnaire', async () => {
  await editorDashboardApi.overview();
  expect(apiGet).toHaveBeenCalledWith('platform/dashboard/overview');
});

it('transmet les filtres et la pagination au serveur', async () => {
  const params = { q: 'Sécurité', sort_by: 'completion' as const, page: 2, per_page: 20 };
  await editorDashboardApi.formations(params);
  expect(apiGet).toHaveBeenCalledWith('platform/dashboard/formations', params);
});

it('prépare la consultation de toutes les inscriptions et de leur numéro de réinscription', async () => {
  await editorDashboardApi.enrollments('formation-id', { status: 'expired', page: 2 });
  expect(apiGet).toHaveBeenCalledWith('platform/dashboard/formations/formation-id/enrollments', {
    status: 'expired',
    page: 2,
  });
});
