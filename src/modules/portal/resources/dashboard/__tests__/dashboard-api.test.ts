import { apiGet } from '@/shared/lib/apiClient';
import { clientDashboardApi, getAllClientDashboardStudents } from '../api';

jest.mock('@/shared/lib/apiClient', () => ({ apiGet: jest.fn() }));

beforeEach(() => jest.resetAllMocks());

it('appelle les endpoints client sans préfixe platform ni identité fournie par le navigateur', async () => {
  await clientDashboardApi.overview();
  await clientDashboardApi.students(2);
  expect(apiGet).toHaveBeenNthCalledWith(1, 'dashboard/client/overview', undefined, {
    signal: undefined,
  });
  expect(apiGet).toHaveBeenNthCalledWith(
    2,
    'dashboard/client/students',
    { page: 2, per_page: 100 },
    { signal: undefined },
  );
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

it('transmet le signal aux deux endpoints', async () => {
  const { signal } = new AbortController();
  await clientDashboardApi.overview(signal);
  await clientDashboardApi.students(3, signal);
  expect(apiGet).toHaveBeenNthCalledWith(1, 'dashboard/client/overview', undefined, { signal });
  expect(apiGet).toHaveBeenNthCalledWith(
    2,
    'dashboard/client/students',
    { page: 3, per_page: 100 },
    { signal },
  );
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function pageResponse(page: number, total = 10) {
  return { data: [{ id: `student-${page}` }], meta: { total, page, per_page: 1 } };
}

async function flushRequests() {
  // Settle the apiGet and API wrapper promise continuations, without timers.
  for (let index = 0; index < 10; index++) await Promise.resolve();
}

it('borne la concurrence à quatre pages et conserve l’ordre même si les réponses arrivent à l’envers', async () => {
  const pending = new Map<number, ReturnType<typeof deferred<ReturnType<typeof pageResponse>>>>();
  let active = 0;
  let peak = 0;
  jest.mocked(apiGet).mockImplementation(async (_path, params) => {
    const page = Number(params?.page);
    if (page === 1) return pageResponse(page);
    const request = deferred<ReturnType<typeof pageResponse>>();
    pending.set(page, request);
    peak = Math.max(peak, ++active);
    try {
      return await request.promise;
    } finally {
      active--;
    }
  });
  const result = getAllClientDashboardStudents();
  await flushRequests();
  expect([...pending.keys()]).toEqual([2, 3, 4, 5]);
  expect(apiGet).toHaveBeenCalledTimes(5);
  for (const page of [5, 4, 3, 2]) pending.get(page)!.resolve(pageResponse(page));
  await flushRequests();
  expect([...pending.keys()]).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  for (const page of [9, 8, 7, 6]) pending.get(page)!.resolve(pageResponse(page));
  await flushRequests();
  pending.get(10)!.resolve(pageResponse(10));
  expect(await result).toEqual(
    Array.from({ length: 10 }, (_, index) => ({ id: `student-${index + 1}` })),
  );
  expect(peak).toBe(4);
});

it('déduplique par inscription sans fusionner deux inscriptions du même apprenant', async () => {
  jest
    .mocked(apiGet)
    .mockResolvedValueOnce({
      ...pageResponse(1, 2),
      data: [{ id: 'first', learner: { id: 'learner' } }],
    })
    .mockResolvedValueOnce({
      ...pageResponse(2, 2),
      data: [
        { id: 'first', learner: { id: 'learner' } },
        { id: 'second', learner: { id: 'learner' } },
      ],
    });
  expect((await getAllClientDashboardStudents()).map((row) => row.id)).toEqual(['first', 'second']);
});

it('ne démarre aucune requête si le signal est déjà annulé', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(getAllClientDashboardStudents(controller.signal)).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(apiGet).not.toHaveBeenCalled();
});

it('annule les requêtes en vol et ne lance pas les pages suivantes', async () => {
  const controller = new AbortController();
  const pending = deferred<ReturnType<typeof pageResponse>>();
  jest.mocked(apiGet).mockResolvedValueOnce(pageResponse(1)).mockReturnValue(pending.promise);
  const result = getAllClientDashboardStudents(controller.signal);
  const rejection = expect(result).rejects.toMatchObject({ name: 'AbortError' });
  await flushRequests();
  controller.abort();
  const signal = jest.mocked(apiGet).mock.calls[1][2]?.signal;
  expect(signal?.aborted).toBe(true);
  pending.resolve(pageResponse(2));
  await rejection;
  expect(apiGet).toHaveBeenCalledTimes(5);
});

it('annule les requêtes sœurs si une page échoue, sans masquer l’erreur', async () => {
  const pending = deferred<ReturnType<typeof pageResponse>>();
  jest.mocked(apiGet).mockResolvedValueOnce(pageResponse(1)).mockReturnValue(pending.promise);
  const result = getAllClientDashboardStudents();
  const rejection = expect(result).rejects.toThrow('indisponible');
  await flushRequests();
  pending.reject(new Error('indisponible'));
  await rejection;
  expect(jest.mocked(apiGet).mock.calls[1][2]?.signal?.aborted).toBe(true);
  expect(apiGet).toHaveBeenCalledTimes(5);
});

it.each([
  { total: 10, per_page: 0 },
  { total: -1, per_page: 100 },
  { total: Infinity, per_page: 100 },
])('rejette une pagination invalide sans démarrer une boucle de requêtes : %j', async (meta) => {
  jest.mocked(apiGet).mockResolvedValueOnce({ data: [], meta });
  await expect(getAllClientDashboardStudents()).rejects.toThrow('Invalid dashboard pagination');
  expect(apiGet).toHaveBeenCalledTimes(1);
});
