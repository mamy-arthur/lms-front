import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { queryClient } from '@/shared/lib/query-client';
import { apiGet, apiPost } from '@/shared/lib/apiClient';
import { endSimulation, startSimulation, synchronizeSimulation } from '../service';
import { useSimulationStore, type SimulationSession } from '../simulation.store';
import { clearSimulationData } from '../local-api';
import { cancelSimulationRequests } from '../transport';

const combinations = [
  [Role.SUPER_ADMIN, Role.EDITOR],
  [Role.SUPER_ADMIN, Role.CLIENT_MANAGER],
  [Role.SUPER_ADMIN, Role.TRAINEE],
  [Role.EDITOR, Role.CLIENT_MANAGER],
  [Role.EDITOR, Role.TRAINEE],
  [Role.CLIENT_MANAGER, Role.TRAINEE],
] as const;
const allowed = {
  [Role.SUPER_ADMIN]: [Role.EDITOR, Role.CLIENT_MANAGER, Role.TRAINEE],
  [Role.EDITOR]: [Role.CLIENT_MANAGER, Role.TRAINEE],
  [Role.CLIENT_MANAGER]: [Role.TRAINEE],
  [Role.TRAINEE]: [],
};
let server: SimulationSession;
function setup(role = Role.SUPER_ADMIN) {
  const user = { id: 'real-id', name: 'Identité réelle', email: 'real@example.test', role };
  useAuthStore.setState({ user, role, simulatedRole: null, sessionId: 'unchanged-session' });
  server = {
    allowed_roles: allowed[role],
    simulated_role: null,
    tenant_id: null,
    shop_tenants: [],
  };
  useSimulationStore.setState({
    phase: 'ready',
    session: server,
    returnPath: null,
    epoch: 0,
    error: null,
  });
  global.fetch = jest.fn(async (url: string, options: RequestInit) => {
    if (url !== '/api/v1/role-simulation') throw new Error('Unexpected network request');
    if (options.method === 'POST')
      server = { ...server, simulated_role: JSON.parse(options.body as string).simulated_role };
    if (options.method === 'DELETE') server = { ...server, simulated_role: null };
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => JSON.stringify({ data: server }),
    } as Response;
  }) as jest.Mock;
  return user;
}
beforeEach(() => {
  setup();
});
afterEach(() => {
  queryClient.clear();
  clearSimulationData();
  cancelSimulationRequests();
  useAuthStore.getState().clearAuth();
  useSimulationStore.setState({ phase: 'idle', session: null });
});

it.each(combinations)(
  '%s → %s → original: preserves identity, cookie credentials and session',
  async (realRole, simulatedRole) => {
    const user = setup(realRole);
    queryClient.setQueryData(['private-users'], [{ email: 'secret@example.test' }]);
    await startSimulation(simulatedRole);
    expect(useAuthStore.getState()).toMatchObject({
      user,
      role: simulatedRole,
      simulatedRole,
      sessionId: 'unchanged-session',
    });
    expect(useAuthStore.getState().user).toBe(user);
    expect(queryClient.getQueryData(['private-users'])).toBeUndefined();
    expect(JSON.parse(localStorage.getItem('auth-store')!).state).toMatchObject({
      user,
      role: realRole,
    });
    expect(JSON.parse(localStorage.getItem('auth-store')!).state.simulatedRole).toBeUndefined();
    await apiGet('users');
    queryClient.setQueryData(['demo-users'], ['fake']);
    await endSimulation();
    expect(useAuthStore.getState()).toMatchObject({
      user,
      role: realRole,
      simulatedRole: null,
      sessionId: 'unchanged-session',
    });
    expect(queryClient.getQueryData(['demo-users'])).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect((fetch as jest.Mock).mock.calls.map(([, options]) => options.method)).toEqual([
      'POST',
      'DELETE',
    ]);
    expect(
      (fetch as jest.Mock).mock.calls.every(([, options]) => options.credentials === 'include'),
    ).toBe(true);
  },
);

it('rejects chaining and forbidden targets without making even a control request', async () => {
  setup(Role.CLIENT_MANAGER);
  await expect(startSimulation(Role.EDITOR)).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
  await startSimulation(Role.TRAINEE);
  await expect(startSimulation(Role.TRAINEE)).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it.each([Role.SUPER_ADMIN, Role.EDITOR, Role.CLIENT_MANAGER])(
  'starts trainee simulation from %s directly on formations and restores the original page on exit',
  async (realRole) => {
    setup(realRole);
    const originalPath = window.location.pathname + window.location.search;
    await expect(startSimulation(Role.TRAINEE)).resolves.toBe('/trainee/formations');
    await expect(endSimulation()).resolves.toBe(originalPath);
  },
);

it('resumes an active server simulation after reload without replacing the real login', async () => {
  const user = setup();
  server = { ...server, simulated_role: Role.EDITOR };
  await synchronizeSimulation();
  expect(useAuthStore.getState()).toMatchObject({
    user,
    role: Role.EDITOR,
    simulatedRole: Role.EDITOR,
  });
  expect(await apiGet('platform/courses')).toMatchObject({ data: expect.any(Array) });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('restores missing local data for an unchanged server role before creating a certificate', async () => {
  const user = useAuthStore.getState().user;
  await startSimulation(Role.EDITOR);
  // A reloaded local module can lose its memory while the auth store retains the role.
  clearSimulationData();
  await synchronizeSimulation();

  const certificate = await apiPost<{ data: { id: string; name: string } }>(
    'platform/certificates',
    { name: 'Attestation de test', body: '<p>Bravo</p>', status: true, setasdefault: false },
  );
  expect(certificate.data.name).toBe('Attestation de test');
  expect(await apiGet(`platform/certificates/${certificate.data.id}`)).toEqual(certificate);
  expect(useSimulationStore.getState().phase).toBe('ready');
  expect(useAuthStore.getState().user).toBe(user);
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('preserves local certificates when resynchronizing an unchanged initialized simulation', async () => {
  await startSimulation(Role.EDITOR);
  const certificate = await apiPost<{ data: { id: string } }>('platform/certificates', {
    name: 'Attestation à conserver',
    body: '<p>Bravo</p>',
  });
  await synchronizeSimulation();
  expect(await apiGet(`platform/certificates/${certificate.data.id}`)).toEqual(certificate);
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('does not restore missing local data if the server cannot confirm the simulation', async () => {
  await startSimulation(Role.EDITOR);
  clearSimulationData();
  (fetch as jest.Mock).mockRejectedValue(new Error('Offline'));
  await synchronizeSimulation();
  expect(useSimulationStore.getState().phase).toBe('error');
  await expect(apiPost('platform/certificates', { name: 'Not created' })).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('fails closed after an ambiguous start and preserves real identity', async () => {
  const user = useAuthStore.getState().user;
  (fetch as jest.Mock).mockRejectedValue(new Error('Offline'));
  await expect(startSimulation(Role.CLIENT_MANAGER)).rejects.toThrow('Offline');
  expect(useSimulationStore.getState().phase).toBe('error');
  await expect(apiGet('users')).rejects.toMatchObject({ name: 'AbortError' });
  expect(useAuthStore.getState().user).toBe(user);
});

it('never restores real writes if exit cannot be confirmed', async () => {
  await startSimulation(Role.CLIENT_MANAGER);
  (fetch as jest.Mock).mockRejectedValue(new Error('Offline'));
  await expect(endSimulation()).rejects.toThrow('Offline');
  expect(useSimulationStore.getState().phase).toBe('error');
  expect(useAuthStore.getState().simulatedRole).toBe(Role.CLIENT_MANAGER);
});

it('does not overwrite the real profile with fictional data', async () => {
  const real = useAuthStore.getState().user!;
  await startSimulation(Role.EDITOR);
  useAuthStore.getState().setAuth({ ...real, name: 'Fake name', role: Role.EDITOR });
  expect(useAuthStore.getState().user).toBe(real);
  await endSimulation();
  expect(useAuthStore.getState().user).toBe(real);
});
