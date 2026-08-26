/**
 * Tests unitaires — resolveRedirectPath() + clearSessionCache()
 *
 * resolveRedirectPath est une fonction pure : aucun mock nécessaire.
 * clearSessionCache délègue à queryClient : on mocke le module pour
 * vérifier l'appel et le prédicat sans dépendance réseau.
 *
 * Note : on mock `@/shared/api/auth.api` pour éviter de charger
 * transitivamente `react-admin` (apiClient.ts → react-admin), qui n'est
 * pas utile pour tester une fonction pure.
 */
import { resolveRedirectPath, clearSessionCache } from '../loginUtils';
import { Role } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';
import type { AuthUser } from '@/shared/types/auth.types';

// Mock avec factory — empêche le chargement réel de auth.api.ts
// et de sa chaîne apiClient.ts → react-admin → react-hotkeys-hook (ESM).
jest.mock('@/shared/api/auth.api', () => ({
  authApi: {
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

const mockRemoveQueries = jest.fn();
jest.mock('@/shared/lib/query-client', () => ({
  queryClient: { removeQueries: (...args: unknown[]) => mockRemoveQueries(...args) },
}));

/** Fabrique un AuthUser minimal pour les besoins du test. */
function makeUser(role: Role): AuthUser {
  return { id: 'user-1', name: 'Test User', email: 'test@learneo.io', role };
}

describe('resolveRedirectPath', () => {
  describe('SUPER_ADMIN', () => {
    it('redirige vers /admin même sans tenant', () => {
      expect(resolveRedirectPath(makeUser(Role.SUPER_ADMIN), false)).toBe(ROUTES.admin.root);
    });

    it('redirige vers /admin avec tenant', () => {
      expect(resolveRedirectPath(makeUser(Role.SUPER_ADMIN), true)).toBe(ROUTES.admin.root);
    });
  });

  describe('EDITOR', () => {
    it('redirige vers /admin avec tenant', () => {
      expect(resolveRedirectPath(makeUser(Role.EDITOR), true)).toBe(ROUTES.admin.root);
    });

    it('redirige vers /admin même sans tenant', () => {
      expect(resolveRedirectPath(makeUser(Role.EDITOR), false)).toBe(ROUTES.admin.root);
    });
  });

  describe('CLIENT_MANAGER', () => {
    it('redirige vers /dashboard quand un tenant existe', () => {
      expect(resolveRedirectPath(makeUser(Role.CLIENT_MANAGER), true)).toBe(
        ROUTES.portal.dashboard,
      );
    });

    it('redirige vers /tenant-not-found sans tenant', () => {
      expect(resolveRedirectPath(makeUser(Role.CLIENT_MANAGER), false)).toBe(ROUTES.tenantNotFound);
    });
  });

  describe('TRAINEE', () => {
    it('redirige vers /dashboard quand un tenant existe', () => {
      expect(resolveRedirectPath(makeUser(Role.TRAINEE), true)).toBe(ROUTES.portal.dashboard);
    });

    it('redirige vers /tenant-not-found sans tenant', () => {
      expect(resolveRedirectPath(makeUser(Role.TRAINEE), false)).toBe(ROUTES.tenantNotFound);
    });
  });
});

describe('clearSessionCache', () => {
  beforeEach(() => mockRemoveQueries.mockClear());

  it('appelle queryClient.removeQueries une seule fois', () => {
    clearSessionCache();
    expect(mockRemoveQueries).toHaveBeenCalledTimes(1);
  });

  it('passe un prédicat qui exclut les requêtes tenant', () => {
    clearSessionCache();
    const [{ predicate }] = mockRemoveQueries.mock.calls[0] as [
      { predicate: (q: { queryKey: unknown[] }) => boolean },
    ];

    expect(predicate({ queryKey: ['tenant'] })).toBe(false);
    expect(predicate({ queryKey: ['tenant', 'current'] })).toBe(false);
  });

  it('passe un prédicat qui inclut toutes les autres requêtes', () => {
    clearSessionCache();
    const [{ predicate }] = mockRemoveQueries.mock.calls[0] as [
      { predicate: (q: { queryKey: unknown[] }) => boolean },
    ];

    expect(predicate({ queryKey: ['users'] })).toBe(true);
    expect(predicate({ queryKey: ['carts', 'active'] })).toBe(true);
    expect(predicate({ queryKey: ['courses'] })).toBe(true);
    expect(predicate({ queryKey: ['portal', 'learning-paths'] })).toBe(true);
  });
});
