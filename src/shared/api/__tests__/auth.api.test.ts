/**
 * Tests unitaires — authApi
 *
 * On vérifie :
 *  - les bons endpoints sont appelés
 *  - toAuthUser mappe correctement BackendUser → AuthUser
 *  - login / platformLogin retournent { user } SANS token
 *  - les erreurs API sont propagées
 */

// ─── Mock apiClient (avant tout import du module testé) ───────────────────────
// jest.fn() inline dans la factory pour éviter le problème de hoisting.

jest.mock('@/shared/lib/apiClient', () => ({ apiPost: jest.fn() }));

import { apiPost } from '@/shared/lib/apiClient';
import {
  authApi,
  type ActivateAccountPayload,
  type ResetPasswordPayload,
  type LoginResult,
} from '../auth.api';
import { Role } from '@/shared/constants/roles';
import type { AuthUser } from '@/shared/types/auth.types';

const mockApiPost = jest.mocked(apiPost);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BACKEND_USER = {
  id: 'u-1',
  tenant_id: 't-1',
  editor_id: null as string | null,
  first_name: 'Alice',
  last_name: 'Dupont',
  full_name: 'Alice Dupont',
  email: 'alice@example.com',
  role: Role.CLIENT_MANAGER,
  is_active: true,
  email_verified_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
};

const EXPECTED_AUTH_USER: AuthUser = {
  id: 'u-1',
  name: 'Alice Dupont',
  email: 'alice@example.com',
  role: Role.CLIENT_MANAGER,
  avatar: null,
};

const LOGIN_RESPONSE = {
  message: 'OK',
  user: BACKEND_USER,
  session_id: 'session-uuid-001',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('authApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login(email, password)', () => {
    it('appelle POST auth/login avec les credentials', async () => {
      mockApiPost.mockResolvedValue(LOGIN_RESPONSE);
      await authApi.login('alice@example.com', 'secret');
      expect(mockApiPost).toHaveBeenCalledWith('auth/login', {
        email: 'alice@example.com',
        password: 'secret',
      });
    });

    it('retourne le résultat discriminé authenticated avec user et sessionId', async () => {
      mockApiPost.mockResolvedValue(LOGIN_RESPONSE);
      const result = await authApi.login('alice@example.com', 'secret');
      expect(result).toStrictEqual<LoginResult>({
        outcome: 'authenticated',
        user: EXPECTED_AUTH_USER,
        sessionId: 'session-uuid-001',
      });
    });

    it('mappe full_name → name', async () => {
      mockApiPost.mockResolvedValue({
        ...LOGIN_RESPONSE,
        user: { ...BACKEND_USER, full_name: 'Bob Martin' },
      });
      const result = await authApi.login('bob@example.com', 'pass');
      expect(result).toMatchObject({ outcome: 'authenticated', user: { name: 'Bob Martin' } });
    });

    it('mappe le rôle SUPER_ADMIN', async () => {
      mockApiPost.mockResolvedValue({
        ...LOGIN_RESPONSE,
        user: { ...BACKEND_USER, role: Role.SUPER_ADMIN },
      });
      const result = await authApi.login('admin@example.com', 'pass');
      expect(result).toMatchObject({ outcome: 'authenticated', user: { role: Role.SUPER_ADMIN } });
    });

    it('retourne session_conflict sur une réponse 409', async () => {
      mockApiPost.mockRejectedValue(
        Object.assign(new Error('Conflict'), {
          status: 409,
          json: {
            code: 'SESSION_ALREADY_ACTIVE',
            message: 'Session active.',
            replacement_token: 'replace-token-abc',
            active_session: {
              device_name: 'PC (Windows)',
              browser: 'Chrome',
              last_activity_at: '2026-08-25T10:00:00Z',
            },
          },
        }),
      );
      const result = await authApi.login('alice@example.com', 'secret');
      expect(result).toStrictEqual<LoginResult>({
        outcome: 'session_conflict',
        existingSession: {
          deviceName: 'PC (Windows)',
          browser: 'Chrome',
          lastActivityAt: '2026-08-25T10:00:00Z',
        },
        replacementToken: 'replace-token-abc',
      });
    });

    it("propage l'exception si l'API renvoie une erreur non-409", async () => {
      mockApiPost.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));
      await expect(authApi.login('x@x.com', 'bad')).rejects.toMatchObject({ status: 401 });
    });
  });

  // ── platformLogin ──────────────────────────────────────────────────────────

  describe('platformLogin(email, password)', () => {
    it('appelle POST platform/auth/login', async () => {
      mockApiPost.mockResolvedValue(LOGIN_RESPONSE);
      await authApi.platformLogin('admin@example.com', 'secret');
      expect(mockApiPost).toHaveBeenCalledWith('platform/auth/login', {
        email: 'admin@example.com',
        password: 'secret',
      });
    });

    it('retourne le résultat discriminé authenticated', async () => {
      mockApiPost.mockResolvedValue(LOGIN_RESPONSE);
      const result = await authApi.platformLogin('admin@example.com', 'secret');
      expect(result).toStrictEqual<LoginResult>({
        outcome: 'authenticated',
        user: EXPECTED_AUTH_USER,
        sessionId: 'session-uuid-001',
      });
    });

    it("propage l'exception sur 403", async () => {
      mockApiPost.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
      await expect(authApi.platformLogin('x@x.com', 'bad')).rejects.toMatchObject({ status: 403 });
    });
  });

  // ── 2FA ────────────────────────────────────────────────────────────────────

  describe('challenge 2FA', () => {
    const CHALLENGE = {
      two_factor_required: true as const,
      challenge_token: 'chal-123',
      expires_in: 600,
      code_length: 6,
      resend_cooldown_seconds: 30,
    };

    it('login retourne un challenge sans tenter de mapper user', async () => {
      mockApiPost.mockResolvedValue(CHALLENGE);

      const result = await authApi.login('alice@example.com', 'secret');

      expect(result).toStrictEqual<LoginResult>({
        outcome: 'two_factor_required',
        challenge: CHALLENGE,
      });
    });

    it('platformLogin retourne également un challenge', async () => {
      mockApiPost.mockResolvedValue(CHALLENGE);

      const result = await authApi.platformLogin('admin@example.com', 'secret');

      expect(result).toStrictEqual<LoginResult>({
        outcome: 'two_factor_required',
        challenge: CHALLENGE,
      });
    });

    it('twoFactorChallenge poste le code et retourne la session', async () => {
      mockApiPost.mockResolvedValue(LOGIN_RESPONSE);

      const result = await authApi.twoFactorChallenge({
        challenge_token: 'chal-123',
        code: '123456',
        trust_device: true,
      });

      expect(mockApiPost).toHaveBeenCalledWith('auth/two-factor-challenge', {
        challenge_token: 'chal-123',
        code: '123456',
        trust_device: true,
      });
      expect(result).toStrictEqual<LoginResult>({
        outcome: 'authenticated',
        user: EXPECTED_AUTH_USER,
        sessionId: 'session-uuid-001',
      });
    });

    it('twoFactorChallenge remonte le conflit de session sur une réponse 409', async () => {
      mockApiPost.mockRejectedValue(
        Object.assign(new Error('Conflict'), {
          status: 409,
          json: {
            code: 'SESSION_ALREADY_ACTIVE',
            message: 'Session active.',
            replacement_token: 'replace-token-abc',
            active_session: {
              device_name: 'PC (Windows)',
              browser: 'Chrome',
              last_activity_at: '2026-08-25T10:00:00Z',
            },
          },
        }),
      );

      const result = await authApi.twoFactorChallenge({
        challenge_token: 'chal-123',
        code: '123456',
      });

      expect(result).toStrictEqual<LoginResult>({
        outcome: 'session_conflict',
        existingSession: {
          deviceName: 'PC (Windows)',
          browser: 'Chrome',
          lastActivityAt: '2026-08-25T10:00:00Z',
        },
        replacementToken: 'replace-token-abc',
      });
    });

    it('twoFactorResend poste le challenge_token', async () => {
      mockApiPost.mockResolvedValue(CHALLENGE);

      await authApi.twoFactorResend('chal-123');

      expect(mockApiPost).toHaveBeenCalledWith('auth/two-factor-resend', {
        challenge_token: 'chal-123',
      });
    });

    it('les routes plateforme ciblent le préfixe platform', async () => {
      mockApiPost.mockResolvedValue(LOGIN_RESPONSE);
      await authApi.platformTwoFactorChallenge({ challenge_token: 'c', code: '1' });
      expect(mockApiPost).toHaveBeenCalledWith(
        'platform/auth/two-factor-challenge',
        expect.anything(),
      );

      mockApiPost.mockResolvedValue(CHALLENGE);
      await authApi.platformTwoFactorResend('c');
      expect(mockApiPost).toHaveBeenCalledWith(
        'platform/auth/two-factor-resend',
        expect.anything(),
      );
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('appelle POST auth/logout sans body', async () => {
      mockApiPost.mockResolvedValue({ message: 'Logged out' });
      await authApi.logout();
      expect(mockApiPost).toHaveBeenCalledWith('auth/logout');
    });
  });

  // ── platformLogout ─────────────────────────────────────────────────────────

  describe('platformLogout()', () => {
    it('appelle POST platform/auth/logout sans body', async () => {
      mockApiPost.mockResolvedValue({ message: 'Logged out' });
      await authApi.platformLogout();
      expect(mockApiPost).toHaveBeenCalledWith('platform/auth/logout');
    });
  });

  // ── forgotPassword ─────────────────────────────────────────────────────────

  describe('forgotPassword(email)', () => {
    it("appelle POST auth/forgot-password avec l'email", async () => {
      mockApiPost.mockResolvedValue({ message: 'Email envoyé' });
      await authApi.forgotPassword('alice@example.com');
      expect(mockApiPost).toHaveBeenCalledWith('auth/forgot-password', {
        email: 'alice@example.com',
      });
    });
  });

  // ── platformForgotPassword ─────────────────────────────────────────────────

  describe('platformForgotPassword(email)', () => {
    it('appelle POST platform/auth/forgot-password', async () => {
      mockApiPost.mockResolvedValue({ message: 'Email envoyé' });
      await authApi.platformForgotPassword('admin@example.com');
      expect(mockApiPost).toHaveBeenCalledWith('platform/auth/forgot-password', {
        email: 'admin@example.com',
      });
    });
  });

  // ── resetPassword ──────────────────────────────────────────────────────────

  describe('resetPassword(payload)', () => {
    const payload: ResetPasswordPayload = {
      email: 'alice@example.com',
      token: 'reset-token-abc',
      password: 'newPass99!',
      password_confirmation: 'newPass99!',
    };

    it('appelle POST auth/reset-password avec le payload complet', async () => {
      mockApiPost.mockResolvedValue({ message: 'Réinitialisé' });
      await authApi.resetPassword(payload);
      expect(mockApiPost).toHaveBeenCalledWith('auth/reset-password', payload);
    });
  });

  // ── platformResetPassword ──────────────────────────────────────────────────

  describe('platformResetPassword(payload)', () => {
    const payload: ResetPasswordPayload = {
      email: 'admin@example.com',
      token: 'platform-reset-token',
      password: 'AdminPass99!',
      password_confirmation: 'AdminPass99!',
    };

    it('appelle POST platform/auth/reset-password', async () => {
      mockApiPost.mockResolvedValue({ message: 'Réinitialisé' });
      await authApi.platformResetPassword(payload);
      expect(mockApiPost).toHaveBeenCalledWith('platform/auth/reset-password', payload);
    });
  });

  // ── activateAccount ────────────────────────────────────────────────────────

  describe('activateAccount(payload)', () => {
    const payload: ActivateAccountPayload = {
      email: 'alice@example.com',
      token: 'activation-token-abc',
      password: 'newPass99!',
      password_confirmation: 'newPass99!',
    };

    // Endpoint distinct de reset-password : il active aussi le compte.
    it('appelle POST auth/activate-account avec le payload complet', async () => {
      mockApiPost.mockResolvedValue({ message: 'Compte activé' });
      await authApi.activateAccount(payload);
      expect(mockApiPost).toHaveBeenCalledWith('auth/activate-account', payload);
    });
  });

  // ── replaceSession ─────────────────────────────────────────────────────────

  describe('replaceSession(replacementToken)', () => {
    it('appelle POST auth/session/replace avec le token', async () => {
      mockApiPost.mockResolvedValue(LOGIN_RESPONSE);
      await authApi.replaceSession('replace-token-abc');
      expect(mockApiPost).toHaveBeenCalledWith('auth/session/replace', {
        replacement_token: 'replace-token-abc',
      });
    });

    it('retourne { user, sessionId } mappés', async () => {
      mockApiPost.mockResolvedValue(LOGIN_RESPONSE);
      const result = await authApi.replaceSession('replace-token-abc');
      expect(result).toStrictEqual({ user: EXPECTED_AUTH_USER, sessionId: 'session-uuid-001' });
    });
  });

  // ── platformReplaceSession ─────────────────────────────────────────────────

  describe('platformReplaceSession(replacementToken)', () => {
    it('appelle POST platform/auth/session/replace', async () => {
      mockApiPost.mockResolvedValue(LOGIN_RESPONSE);
      await authApi.platformReplaceSession('replace-token-platform');
      expect(mockApiPost).toHaveBeenCalledWith('platform/auth/session/replace', {
        replacement_token: 'replace-token-platform',
      });
    });

    it('retourne { user, sessionId } mappés', async () => {
      mockApiPost.mockResolvedValue(LOGIN_RESPONSE);
      const result = await authApi.platformReplaceSession('replace-token-platform');
      expect(result).toStrictEqual({ user: EXPECTED_AUTH_USER, sessionId: 'session-uuid-001' });
    });
  });
});
