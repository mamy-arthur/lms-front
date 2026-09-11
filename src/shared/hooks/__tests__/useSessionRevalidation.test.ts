/**
 * Tests unitaires — useSessionRevalidation
 *
 * Ce hook est le seul de la révocation de session à pouvoir DÉCONNECTER
 * l'utilisateur. Les cas couverts ici sont ceux dont une régression serait
 * silencieuse : une session réparée à tort déconnectée, ou l'inverse.
 */

jest.mock('@/shared/api/auth.api', () => ({
  authApi: { me: jest.fn(), platformMe: jest.fn() },
}));
jest.mock('@/shared/stores/auth.store', () => ({ useAuthStore: jest.fn() }));
jest.mock('@/shared/lib/query-client', () => ({ queryClient: { clear: jest.fn() } }));
jest.mock('@/shared/lib/echo', () => ({ resetEcho: jest.fn() }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  usePathname: () => mockPathname,
}));
jest.mock('@/shared/lib/apiClient', () => ({
  resolveLoginPath: jest.fn((p: string) => (p.startsWith('/admin') ? '/admin/login' : '/login')),
}));

const mockRouterReplace = jest.fn();
let mockPathname = '/dashboard';

import { renderHook, waitFor } from '@testing-library/react';
import { useSessionRevalidation } from '../useSessionRevalidation';
import { authApi } from '@/shared/api/auth.api';
import { queryClient } from '@/shared/lib/query-client';
import { resetEcho } from '@/shared/lib/echo';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import type { AuthUser } from '@/shared/types/auth.types';

const mockMe = jest.mocked(authApi.me);
const mockPlatformMe = jest.mocked(authApi.platformMe);
const mockResetEcho = jest.mocked(resetEcho);
const mockQueryClear = jest.mocked(queryClient.clear);

const mockSetAuth = jest.fn();
const mockClearAuth = jest.fn();

const USER: AuthUser = {
  id: 'user-1',
  name: 'Alex Martin',
  email: 'alex@example.com',
  role: Role.TRAINEE,
};

/**
 * Le hook lit `user` et `role` par sélecteur, et relit l'état courant via
 * getState() à la résolution de la sonde — les deux doivent rester pilotables
 * indépendamment pour reproduire une déconnexion survenue pendant l'appel.
 */
function mockStore({
  user = USER,
  role = Role.TRAINEE as Role | null,
  sessionId = null as string | null,
}: { user?: AuthUser | null; role?: Role | null; sessionId?: string | null } = {}) {
  const state = { user, role, sessionId, setAuth: mockSetAuth, clearAuth: mockClearAuth };

  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
  (useAuthStore as unknown as { getState: jest.Mock }).getState = jest.fn(() => state);

  return state;
}

function fireVisible() {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => 'visible',
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useSessionRevalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterReplace.mockReset();
    mockPathname = '/dashboard';
    mockMe.mockResolvedValue({ user: USER, sessionId: 'session-1' });
    mockPlatformMe.mockResolvedValue({ user: USER, sessionId: 'session-1' });
  });

  // --- Réparation d'une session sans sessionId local ---

  it('rapatrie le sessionId renvoyé par le serveur quand le store est vide', async () => {
    mockStore({ sessionId: null });

    renderHook(() => useSessionRevalidation());

    await waitFor(() => expect(mockSetAuth).toHaveBeenCalledWith(USER, 'session-1'));
    // Le point du test : réparer, surtout pas déconnecter.
    expect(mockClearAuth).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("n'écrase pas un sessionId déjà présent dans le store", async () => {
    mockStore({ sessionId: 'session-local' });

    renderHook(() => useSessionRevalidation());

    await waitFor(() => expect(mockMe).toHaveBeenCalled());
    expect(mockSetAuth).not.toHaveBeenCalled();
  });

  // --- Session antérieure au suivi : reconnexion forcée ---

  it('force la reconnexion quand le serveur ne connaît aucun sessionId', async () => {
    mockStore({ sessionId: null });
    mockMe.mockResolvedValue({ user: USER, sessionId: null });

    renderHook(() => useSessionRevalidation());

    await waitFor(() => expect(mockClearAuth).toHaveBeenCalled());
    expect(mockResetEcho).toHaveBeenCalled();
    expect(mockQueryClear).toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith('/login');
    expect(mockSetAuth).not.toHaveBeenCalled();
  });

  it('redirige vers le login admin depuis une route admin', async () => {
    mockPathname = '/admin/users';
    mockStore({ sessionId: null, role: Role.EDITOR });
    mockPlatformMe.mockResolvedValue({ user: USER, sessionId: null });

    renderHook(() => useSessionRevalidation());

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/admin/login'));
  });

  // --- Course avec une déconnexion ---

  it('ignore la réponse si l’utilisateur s’est déconnecté pendant la sonde', async () => {
    const state = mockStore({ sessionId: null });

    let resolveProbe: (value: { user: AuthUser; sessionId: string | null }) => void = () => {};
    mockMe.mockReturnValue(
      new Promise((resolve) => {
        resolveProbe = resolve;
      }),
    );

    renderHook(() => useSessionRevalidation());
    await waitFor(() => expect(mockMe).toHaveBeenCalled());

    // Déconnexion pendant que la requête est en vol.
    state.user = null;
    resolveProbe({ user: USER, sessionId: 'session-1' });

    await waitFor(() => expect(mockMe).toHaveBeenCalledTimes(1));
    // Sans le garde `user === null`, la sonde ressusciterait la session.
    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockClearAuth).not.toHaveBeenCalled();
  });

  // --- Limitation de fréquence ---

  it('ne sonde qu’une fois pour plusieurs retours d’onglet en moins d’une minute', async () => {
    mockStore({ sessionId: 'session-local' });

    renderHook(() => useSessionRevalidation());
    await waitFor(() => expect(mockMe).toHaveBeenCalledTimes(1));

    fireVisible();
    fireVisible();

    expect(mockMe).toHaveBeenCalledTimes(1);
  });

  it('sonde à nouveau une fois la minute écoulée', async () => {
    mockStore({ sessionId: 'session-local' });
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(0);

    renderHook(() => useSessionRevalidation());
    await waitFor(() => expect(mockMe).toHaveBeenCalledTimes(1));

    nowSpy.mockReturnValue(60_001);
    fireVisible();

    await waitFor(() => expect(mockMe).toHaveBeenCalledTimes(2));
    nowSpy.mockRestore();
  });

  // --- Sélection de l'endpoint et cas inertes ---

  it('interroge la route plateforme pour un rôle plateforme', async () => {
    mockStore({ role: Role.SUPER_ADMIN, sessionId: 'session-local' });

    renderHook(() => useSessionRevalidation());

    await waitFor(() => expect(mockPlatformMe).toHaveBeenCalled());
    expect(mockMe).not.toHaveBeenCalled();
  });

  it('ne sonde pas en l’absence d’utilisateur', () => {
    mockStore({ user: null, role: null });

    renderHook(() => useSessionRevalidation());

    expect(mockMe).not.toHaveBeenCalled();
    expect(mockPlatformMe).not.toHaveBeenCalled();
  });

  it('laisse la session intacte quand la sonde échoue pour une autre raison', async () => {
    mockStore({ sessionId: 'session-local' });
    mockMe.mockRejectedValue(new Error('network'));

    renderHook(() => useSessionRevalidation());

    await waitFor(() => expect(mockMe).toHaveBeenCalled());
    // Un 401 est déjà traité par httpClient ; tout le reste ne doit rien casser.
    expect(mockClearAuth).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
