/** @jest-environment node */

import { clientManagerDetailApi } from '../client-manager-detail.api';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import type { ClientManagerPurchasesParams } from '@/shared/types/client-manager-detail.types';

const target = 'responsable/a ?#%';
const params: ClientManagerPurchasesParams = {
  page: 3,
  per_page: 20,
  q: 'sécurité & santé',
  sort_by: 'name',
  sort_dir: 'asc',
};
let fetchMock: jest.SpiedFunction<typeof fetch>;

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'actor', name: 'Éditeur', email: 'actor@example.test', role: Role.EDITOR },
    role: Role.EDITOR,
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

describe.each(['admin', 'portal'] as const)('Transport du responsable %s', (area) => {
  const base = `/api/v1/${area === 'admin' ? 'platform/' : ''}users/${encodeURIComponent(target)}`;

  it('charge le profil ciblé avec le bon préfixe, le tenant et sans /me', async () => {
    const body = { data: { id: target, role: Role.CLIENT_MANAGER } };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body)));
    expect(await clientManagerDetailApi.profile(area, target)).toEqual(body);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      base,
      expect.objectContaining({ credentials: 'include' }),
    );
    const options = fetchMock.mock.calls[0][1];
    expect(new Headers(options?.headers).get('X-Tenant-ID')).toBe('tenant-1');
    expect(options?.method ?? 'GET').toBe('GET');
    expect(options?.body).toBeUndefined();
  });

  it('transmet les paramètres exacts et conserve les compteurs zéro, nulls et achats distincts', async () => {
    const body = {
      data: [
        {
          id: 'achat-1',
          created_at: '2026-10-01',
          learning_path: null,
          modules_count: 0,
          evaluations_count: 0,
        },
        {
          id: 'achat-2',
          created_at: '2026-10-02',
          learning_path: {
            id: 'formation-1',
            description: null,
            image: null,
            category_id: null,
            category_name: null,
          },
          modules_count: 7,
          evaluations_count: 2,
        },
      ],
      meta: { total: 42, page: 3, per_page: 20 },
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body)));
    const input = Object.freeze({ ...params });
    expect(await clientManagerDetailApi.purchases(area, target, input)).toEqual(body);
    const url = new URL(String(fetchMock.mock.calls[0][0]), 'https://learneo.example');
    expect(url.pathname).toBe(`${base}/purchased-learning-paths`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: '3',
      per_page: '20',
      q: 'sécurité & santé',
      sort_by: 'name',
      sort_dir: 'asc',
    });
    expect(input).toEqual(params);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('omet la recherche vide sans envoyer de statut ni de paramètres supplémentaires', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [] })));
    await clientManagerDetailApi.purchases(area, target, {
      page: 1,
      per_page: 20,
      q: '',
      sort_by: 'created_at',
      sort_dir: 'desc',
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${base}/purchased-learning-paths?page=1&per_page=20&sort_by=created_at&sort_dir=desc`,
    );
  });

  it.each(['profil', 'achats'])('propage l’annulation du %s indépendamment', async (resource) => {
    const controllers = [new AbortController(), new AbortController()];
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
    const promises = [
      clientManagerDetailApi.profile(area, target, controllers[0].signal),
      clientManagerDetailApi.purchases(area, target, params, controllers[1].signal),
    ];
    const canceled = resource === 'profil' ? 0 : 1;
    const result = expect(promises[canceled]).rejects.toMatchObject({ name: 'AbortError' });
    controllers[canceled].abort();
    await result;
    expect(fetchMock.mock.calls[canceled][1]?.signal?.aborted).toBe(true);
    expect(fetchMock.mock.calls[1 - canceled][1]?.signal?.aborted).toBe(false);
    complete[1 - canceled](new Response(JSON.stringify({ data: [] })));
    await expect(promises[1 - canceled]).resolves.toEqual({ data: [] });
  });

  it.each([403, 404, 500])('propage les erreurs %s sans données inventées', async (status) => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ message: 'Indisponible' }), { status }),
    );
    await expect(clientManagerDetailApi.profile(area, target)).rejects.toMatchObject({ status });
    await expect(clientManagerDetailApi.purchases(area, target, params)).rejects.toMatchObject({
      status,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
