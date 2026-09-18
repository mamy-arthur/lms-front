import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  apiUpload,
  apiUploadWithProgress,
  httpClient,
} from '@/shared/lib/apiClient';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import { useSimulationStore } from '../simulation.store';
import { resetSimulationData, clearSimulationData } from '../local-api';
import { SIMULATION_IDS as ids } from '../fixtures';
import { cancelSimulationRequests } from '../transport';

const realUser = {
  id: 'real-account',
  name: 'Real account',
  email: 'real@example.test',
  role: Role.SUPER_ADMIN,
};
function networkResponse(json: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(json),
  } as Response;
}

beforeEach(() => {
  useAuthStore.setState({
    user: realUser,
    role: Role.CLIENT_MANAGER,
    simulatedRole: Role.CLIENT_MANAGER,
    sessionId: 'real-session',
  });
  useSimulationStore.setState({ phase: 'ready', epoch: 0 });
  resetSimulationData(Role.CLIENT_MANAGER);
  global.fetch = jest.fn().mockRejectedValue(new Error('Unexpected real network call'));
});
afterEach(() => {
  cancelSimulationRequests();
  clearSimulationData();
  useAuthStore.getState().clearAuth();
  useSimulationStore.setState({ phase: 'idle' });
  jest.restoreAllMocks();
});

it('intercepts GET, POST, PUT, PATCH and DELETE and rereads local state without network', async () => {
  const created = await apiPost<{ data: { id: string } }>('users', {
    first_name: 'Camille',
    last_name: 'Démo',
    email: 'camille@example.test',
    role: Role.TRAINEE,
  });
  const path = `users/${created.data.id}`;
  await apiPut(path, { first_name: 'Camille modifié' });
  await apiPatch(path, { last_name: 'Test' });
  expect(await apiGet(path)).toMatchObject({
    data: { first_name: 'Camille modifié', last_name: 'Test' },
  });
  await apiDelete(path);
  await expect(apiGet(path)).rejects.toMatchObject({ status: 404 });
  expect(fetch).not.toHaveBeenCalled();
  expect(useAuthStore.getState().user).toBe(realUser);
  expect(useAuthStore.getState().sessionId).toBe('real-session');
});

it('intercepts multipart and XHR uploads before constructing a network request', async () => {
  const xhr = jest.spyOn(window, 'XMLHttpRequest');
  const form = new FormData();
  form.append('file', new File(['test'], 'demo.png', { type: 'image/png' }));
  const progress = jest.fn();
  await apiUpload(`users/${ids.manager}/profile-photo`, form);
  await apiUploadWithProgress(`users/${ids.manager}/profile-photo`, form, progress);
  expect(progress).toHaveBeenCalledWith(100);
  expect(xhr).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

it('reads the real shop through the dedicated route and performs checkout only locally', async () => {
  const image = '/api/v1/role-simulation/shop/learning-paths/real-product/image';
  (fetch as jest.Mock).mockResolvedValue(
    networkResponse({
      data: [
        {
          id: 'real-product',
          name: 'Catalogue réel',
          price: 37,
          currency: 'EUR',
          image: { url: image },
        },
      ],
      meta: { total: 1 },
    }),
  );
  const catalog = await apiGet('shop/learning-paths', { q: 'React' });
  expect(catalog).toMatchObject({ data: [{ name: 'Catalogue réel', image: { url: image } }] });
  expect(fetch).toHaveBeenCalledWith(
    '/api/v1/role-simulation/shop/learning-paths?q=React',
    expect.anything(),
  );
  const cart = await apiPost<{ data: { items: Array<{ id: string }> } }>('carts/items', {
    learning_path_id: 'real-product',
  });
  await apiPatch(`carts/items/${cart.data.items[0].id}`, { quantity: 2 });
  expect(await apiGet('carts')).toMatchObject({ data: { total: 74, items: [{ image }] } });
  await apiPost('orders', { payment_method: 'card' });
  expect(await apiGet('carts')).toMatchObject({ data: { items: [], total: 0 } });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
  'never sends %s to shop or arbitrary API endpoints',
  async (method) => {
    await expect(
      httpClient('/api/v1/shop/learning-paths', { method, body: '{}' }),
    ).rejects.toBeDefined();
    await expect(httpClient('/api/v1/payments', { method, body: '{}' })).rejects.toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  },
);

it.each([
  'platform/users',
  'orders',
  'https://external.example/api/v1/users',
  'auth/logout',
  'platform/auth/logout',
  'impersonations',
  'unknown-path',
])('never leaks %s over the network', async (path) => {
  try {
    await httpClient(path, { method: 'POST', body: '{}' });
  } catch {
    /* fail closed */
  }
  expect(fetch).not.toHaveBeenCalled();
});

it('does not treat shop-like prefix/suffix URLs as an allowlist match', async () => {
  for (const url of [
    '/api/v1/shop/learning-paths/id/export',
    '/api/v1/shop/learning-paths-unsafe',
    'https://external.example/api/v1/shop/learning-paths',
  ]) {
    await expect(httpClient(url)).rejects.toBeDefined();
  }
  expect(fetch).not.toHaveBeenCalled();
});

it('blocks requests during transitions and failed synchronization', async () => {
  for (const phase of ['checking', 'transition', 'error'] as const) {
    useSimulationStore.setState({ phase });
    await expect(apiGet('users')).rejects.toMatchObject({ name: 'AbortError' });
    await expect(apiPost('orders')).rejects.toMatchObject({ name: 'AbortError' });
  }
  expect(fetch).not.toHaveBeenCalled();
});

it('rejects late responses from the previous context before they can populate caches', async () => {
  useAuthStore.getState().setSimulatedRole(null);
  let resolve!: (response: Response) => void;
  (fetch as jest.Mock).mockImplementation(
    () =>
      new Promise<Response>((r) => {
        resolve = r;
      }),
  );
  const request = apiGet('users');
  cancelSimulationRequests();
  resolve(networkResponse({ data: [{ email: 'private@example.test' }] }));
  await expect(request).rejects.toMatchObject({ name: 'AbortError' });
});

it('keeps lifecycle and real identity reads separate from business writes', async () => {
  (fetch as jest.Mock).mockResolvedValue(networkResponse({ data: {} }));
  await apiGet('role-simulation');
  await apiGet('platform/auth/me');
  await apiDelete('role-simulation');
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(useAuthStore.getState().user).toBe(realUser);
});

it('never sends a demo entity from a stale callback after exit', async () => {
  useAuthStore.getState().setSimulatedRole(null);
  await expect(apiPatch(`users/${ids.manager}`, { first_name: 'Demo' })).rejects.toMatchObject({
    name: 'AbortError',
  });
  await expect(apiPost('enrollments', { learner_ids: [ids.learner] })).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(fetch).not.toHaveBeenCalled();
});
