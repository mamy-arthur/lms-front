/** @jest-environment node */

import { traineeDetailApi } from '../trainee-detail.api';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import type { TraineeEnrollmentsParams } from '@/shared/types/trainee-detail.types';

// Transport réel (apiGet, sérialisation, simulation et stores) ; seul fetch est remplacé.
const areas = ['admin', 'portal'] as const;
const target = 'élève/a ?#%';
const encodedTarget = '%C3%A9l%C3%A8ve%2Fa%20%3F%23%25';
const params: TraineeEnrollmentsParams = {
  page: 3,
  per_page: 20,
  q: 'sécurité & santé',
  status: 'in_progress',
  sort_by: 'title',
  sort_dir: 'asc',
};
let fetchMock: jest.SpiedFunction<typeof fetch>;

beforeEach(() => {
  // Pas de localStorage dans Node : utiliser le vrai store sans persistance navigateur.
  useAuthStore.setState({
    user: {
      id: 'acteur-distinct',
      name: 'Gestionnaire',
      email: 'actor@example.test',
      role: Role.CLIENT_MANAGER,
    },
    role: Role.CLIENT_MANAGER,
    sessionId: 'session-1',
    simulatedRole: null,
  });
  useTenantStore.getState().setTenant({
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    domain: 'acme.example.test',
    status: 'active',
    is_active: true,
    features: { certificates: false, liveSession: false, customDomain: false },
  });
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  jest.restoreAllMocks();
  useAuthStore.setState(useAuthStore.getInitialState());
  useTenantStore.getState().clearTenant();
});

describe.each(areas)('Transport du détail stagiaire %s', (area) => {
  const base = `/api/v1/${area === 'admin' ? 'platform/' : ''}users/${encodedTarget}`;

  it('charge exactement la cible encodée sans consulter /me', async () => {
    const body = { data: { id: target, role: Role.TRAINEE, full_name: 'Alice' } };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body)));
    expect(await traineeDetailApi.profile(area, target)).toEqual(body);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      base,
      expect.objectContaining({ credentials: 'include', signal: expect.any(AbortSignal) }),
    );
    const options = fetchMock.mock.calls[0][1];
    expect(new Headers(options?.headers).get('X-Tenant-ID')).toBe('tenant-1');
    expect(options?.method ?? 'GET').toBe('GET');
    expect(options?.body).toBeUndefined();
  });

  it('transmet les paramètres exacts sans transformer progression, dates ou inscriptions dupliquées', async () => {
    const body = {
      data: [
        {
          id: 'inscription-1',
          progress_percent: 37.5,
          completed_modules: 2,
          total_modules: 6,
          time_spent_seconds: 3661,
          started_at: null,
          learning_path: { id: 'formation-1' },
        },
        {
          id: 'inscription-2',
          progress_percent: 81,
          completed_modules: 5,
          total_modules: 5,
          time_spent_seconds: 59,
          started_at: '2026-09-01T10:00:00Z',
          learning_path: { id: 'formation-1' },
        },
      ],
      meta: { total: 42, page: 3, per_page: 20 },
    };
    const input = Object.freeze({ ...params });
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body)));
    expect(await traineeDetailApi.enrollments(area, target, input)).toEqual(body);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchMock.mock.calls[0][0]), 'https://learneo.example');
    expect(url.pathname).toBe(`${base}/enrollments`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: '3',
      per_page: '20',
      q: 'sécurité & santé',
      status: 'in_progress',
      sort_by: 'title',
      sort_dir: 'asc',
    });
    expect(url.search).toContain('q=s%C3%A9curit%C3%A9%20%26%20sant%C3%A9');
    expect(input).toEqual(params);
  });

  it('omet recherche vide et statut absent sans ajouter de cible issue de /me', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [], meta: { page: 1, per_page: 20, total: 0 } })),
    );
    await traineeDetailApi.enrollments(area, target, {
      page: 1,
      per_page: 20,
      q: '',
      sort_by: 'enrolled_at',
      sort_dir: 'desc',
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${base}/enrollments?page=1&per_page=20&sort_by=enrolled_at&sort_dir=desc`,
    ]);
  });

  it.each(['profil', 'inscriptions'])(
    'propage AbortSignal pour %s sans annuler l’autre ressource',
    async (resource) => {
      const profileController = new AbortController();
      const enrollmentsController = new AbortController();
      const complete: Array<(response: Response) => void> = [];
      fetchMock.mockImplementation(
        (_url, options) =>
          new Promise((resolve, reject) => {
            complete.push(resolve);
            options?.signal?.addEventListener(
              'abort',
              () => reject(new DOMException('Annulée', 'AbortError')),
              { once: true },
            );
          }),
      );
      const profile = traineeDetailApi.profile(area, target, profileController.signal);
      const enrollments = traineeDetailApi.enrollments(
        area,
        target,
        params,
        enrollmentsController.signal,
      );
      const canceled = resource === 'profil' ? 0 : 1;
      const result = expect(canceled === 0 ? profile : enrollments).rejects.toMatchObject({
        name: 'AbortError',
      });
      (canceled === 0 ? profileController : enrollmentsController).abort();
      await result;
      // Le transport compose le signal fourni : on vérifie sa propagation, pas son identité.
      expect(fetchMock.mock.calls[canceled][1]?.signal?.aborted).toBe(true);
      expect(fetchMock.mock.calls[1 - canceled][1]?.signal?.aborted).toBe(false);
      const body = { data: [] };
      complete[1 - canceled](new Response(JSON.stringify(body)));
      expect(await (canceled === 0 ? enrollments : profile)).toEqual(body);
      expect(fetchMock.mock.calls.map(([url]) => String(url).split('?')[0])).toEqual([
        base,
        `${base}/enrollments`,
      ]);
    },
  );

  it.each([403, 404, 500])(
    'propage une réponse %s sans profil ou liste de remplacement',
    async (status) => {
      fetchMock.mockImplementation(
        async () => new Response(JSON.stringify({ message: 'Indisponible' }), { status }),
      );
      await expect(traineeDetailApi.profile(area, target)).rejects.toMatchObject({ status });
      await expect(traineeDetailApi.enrollments(area, target, params)).rejects.toMatchObject({
        status,
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );
});
