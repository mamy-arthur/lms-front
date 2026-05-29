/**
 * Tests unitaires — resolveRedirectPath()
 *
 * Fonction pure : aucun effet de bord, aucun mock nécessaire.
 * On vérifie la table de décision décrite dans le JSDoc de loginUtils.ts.
 *
 * Note : on mock `@/shared/api/auth.api` pour éviter de charger
 * transitivamente `react-admin` (apiClient.ts → react-admin), qui n'est
 * pas utile pour tester une fonction pure.
 */
import { resolveRedirectPath } from "../loginUtils";
import { Role } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";
import type { AuthUser } from "@/shared/types/auth.types";

// Mock avec factory — empêche le chargement réel de auth.api.ts
// et de sa chaîne apiClient.ts → react-admin → react-hotkeys-hook (ESM).
jest.mock("@/shared/api/auth.api", () => ({
  authApi: {
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

/** Fabrique un AuthUser minimal pour les besoins du test. */
function makeUser(role: Role): AuthUser {
  return { id: "user-1", name: "Test User", email: "test@learneo.io", role };
}

describe("resolveRedirectPath", () => {
  describe("SUPER_ADMIN", () => {
    it("redirige vers /dashboard même sans tenant", () => {
      expect(resolveRedirectPath(makeUser(Role.SUPER_ADMIN), false)).toBe(
        ROUTES.portal.dashboard,
      );
    });

    it("redirige vers /dashboard avec tenant", () => {
      expect(resolveRedirectPath(makeUser(Role.SUPER_ADMIN), true)).toBe(
        ROUTES.portal.dashboard,
      );
    });
  });

  describe("EDITOR", () => {
    it("redirige vers /dashboard quand un tenant existe", () => {
      expect(resolveRedirectPath(makeUser(Role.EDITOR), true)).toBe(
        ROUTES.portal.dashboard,
      );
    });

    it("redirige vers /tenant-not-found sans tenant", () => {
      expect(resolveRedirectPath(makeUser(Role.EDITOR), false)).toBe(
        ROUTES.tenantNotFound,
      );
    });
  });

  describe("CLIENT_MANAGER", () => {
    it("redirige vers /dashboard quand un tenant existe", () => {
      expect(resolveRedirectPath(makeUser(Role.CLIENT_MANAGER), true)).toBe(
        ROUTES.portal.dashboard,
      );
    });

    it("redirige vers /tenant-not-found sans tenant", () => {
      expect(resolveRedirectPath(makeUser(Role.CLIENT_MANAGER), false)).toBe(
        ROUTES.tenantNotFound,
      );
    });
  });

  describe("TRAINEE", () => {
    it("redirige vers /dashboard quand un tenant existe", () => {
      expect(resolveRedirectPath(makeUser(Role.TRAINEE), true)).toBe(
        ROUTES.portal.dashboard,
      );
    });

    it("redirige vers /tenant-not-found sans tenant", () => {
      expect(resolveRedirectPath(makeUser(Role.TRAINEE), false)).toBe(
        ROUTES.tenantNotFound,
      );
    });
  });
});
