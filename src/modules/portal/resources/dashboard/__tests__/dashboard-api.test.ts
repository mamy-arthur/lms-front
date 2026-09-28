import { apiGet } from '@/shared/lib/apiClient';
import { clientDashboardApi, getAllClientDashboardStudents } from '../api';

jest.mock('@/shared/lib/apiClient', () => ({ apiGet: jest.fn() }));

beforeEach(() => jest.resetAllMocks());

it('appelle les endpoints client sans préfixe platform ni identité fournie par le navigateur', async () => {
  await clientDashboardApi.overview();
  await clientDashboardApi.students(2);
  expect(apiGet).toHaveBeenNthCalledWith(1, 'dashboard/client/overview');
  expect(apiGet).toHaveBeenNthCalledWith(2, 'dashboard/client/students', {
    page: 2,
    per_page: 100,
  });
});

it('charge toutes les pages pour alimenter le graphique et les filtres locaux', async () => {
  jest
    .mocked(apiGet)
    .mockResolvedValueOnce({ data: [{ id: 'first' }], meta: { total: 2, page: 1, per_page: 1 } })
    .mockResolvedValueOnce({ data: [{ id: 'second' }], meta: { total: 2, page: 2, per_page: 1 } });
  expect(await getAllClientDashboardStudents()).toEqual([{ id: 'first' }, { id: 'second' }]);
  expect(apiGet).toHaveBeenCalledTimes(2);
});

it('ne transforme pas une erreur sur une page suivante en résultat partiel', async () => {
  jest
    .mocked(apiGet)
    .mockResolvedValueOnce({ data: [{ id: 'first' }], meta: { total: 2, page: 1, per_page: 1 } })
    .mockRejectedValueOnce(new Error('indisponible'));
  await expect(getAllClientDashboardStudents()).rejects.toThrow('indisponible');
});
