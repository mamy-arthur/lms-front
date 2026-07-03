/**
 * Tests unitaires — useAuthStore
 *
 * Vérifie le stockage de l'utilisateur et du rôle.
 * Aucun document.cookie, aucun token ne doit apparaître dans l'état.
 */
import { useAuthStore } from '../auth.store';
import { Role } from '@/shared/constants/roles';
import type { AuthUser } from '@/shared/types/auth.types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeUser(role: Role): AuthUser {
  return { id: 'u-1', name: 'Alice', email: 'alice@example.com', role };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, role: null });
  });

  // ── setAuth ────────────────────────────────────────────────────────────────

  describe('setAuth(user)', () => {
    it("stocke l'utilisateur dans le state", () => {
      const user = makeUser(Role.SUPER_ADMIN);
      useAuthStore.getState().setAuth(user);
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it('dérive le rôle depuis user.role', () => {
      useAuthStore.getState().setAuth(makeUser(Role.EDITOR));
      expect(useAuthStore.getState().role).toBe(Role.EDITOR);
    });

    it('met à jour le rôle si setAuth est rappelé', () => {
      useAuthStore.getState().setAuth(makeUser(Role.SUPER_ADMIN));
      useAuthStore.getState().setAuth(makeUser(Role.CLIENT_MANAGER));
      expect(useAuthStore.getState().role).toBe(Role.CLIENT_MANAGER);
    });

    it("ne stocke pas de propriété 'token'", () => {
      useAuthStore.getState().setAuth(makeUser(Role.TRAINEE));
      // Le cast via unknown est volontaire : on vérifie l'absence du champ
      // à l'exécution, même si TypeScript le garantit déjà à la compilation.
      const state = useAuthStore.getState() as unknown as Record<string, unknown>;
      expect(state['token']).toBeUndefined();
    });

    it('ne modifie pas document.cookie', () => {
      const spy = jest.spyOn(document, 'cookie', 'set');
      useAuthStore.getState().setAuth(makeUser(Role.SUPER_ADMIN));
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ── clearAuth ──────────────────────────────────────────────────────────────

  describe('clearAuth()', () => {
    it('remet user et role à null', () => {
      useAuthStore.getState().setAuth(makeUser(Role.SUPER_ADMIN));
      useAuthStore.getState().clearAuth();
      const { user, role } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(role).toBeNull();
    });

    it('est idempotent (appels multiples sans erreur)', () => {
      useAuthStore.getState().clearAuth();
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('ne modifie pas document.cookie', () => {
      useAuthStore.getState().setAuth(makeUser(Role.TRAINEE));
      const spy = jest.spyOn(document, 'cookie', 'set');
      useAuthStore.getState().clearAuth();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ── état initial ───────────────────────────────────────────────────────────

  describe('état initial', () => {
    it('user est null', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('role est null', () => {
      expect(useAuthStore.getState().role).toBeNull();
    });

    it("pas de champ 'token' dans l'état initial", () => {
      const state = useAuthStore.getState() as unknown as Record<string, unknown>;
      expect(state['token']).toBeUndefined();
    });
  });

  // ── tous les rôles couverts ────────────────────────────────────────────────

  describe.each([[Role.SUPER_ADMIN], [Role.EDITOR], [Role.CLIENT_MANAGER], [Role.TRAINEE]])(
    'setAuth avec rôle %s',
    (role) => {
      it('stocke le bon rôle', () => {
        useAuthStore.getState().setAuth(makeUser(role));
        expect(useAuthStore.getState().role).toBe(role);
      });
    },
  );
});
