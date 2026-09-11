/**
 * Tests unitaires — useLoginFlow
 *
 * Le parcours mutualisé entre le login tenant et le login plateforme : mot de
 * passe, challenge 2FA, conflit de session, message de révocation. Les chemins
 * couverts ici sont ceux que `LoginForm.test.tsx` ne traverse qu'indirectement.
 */

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockRouterReplace }) }));
jest.mock('@/shared/stores/auth.store', () => ({ useAuthStore: jest.fn() }));
jest.mock('@/shared/stores/tenant.store', () => ({
  useTenantStore: { getState: jest.fn(() => ({ tenant: { id: 'tenant-1' } })) },
}));
jest.mock('@/modules/auth/utils/loginUtils', () => ({
  clearSessionCache: jest.fn(),
  resolveRedirectPath: jest.fn(() => '/dashboard'),
}));

const mockRouterReplace = jest.fn();

import { act, renderHook, waitFor } from '@testing-library/react';
import { useLoginFlow, type LoginFlowEndpoints } from '../useLoginFlow';
import { clearSessionCache, resolveRedirectPath } from '@/modules/auth/utils/loginUtils';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import type { AuthUser } from '@/shared/types/auth.types';
import type { ExistingSessionInfo, TwoFactorChallenge } from '@/shared/api/auth.api';

const mockSetAuth = jest.fn();
const mockClearSessionCache = jest.mocked(clearSessionCache);
const mockResolveRedirectPath = jest.mocked(resolveRedirectPath);

const USER: AuthUser = {
  id: 'user-1',
  name: 'Alex Martin',
  email: 'alex@example.com',
  role: Role.TRAINEE,
};

const CHALLENGE: TwoFactorChallenge = {
  two_factor_required: true,
  challenge_token: 'challenge-token-1',
  expires_in: 300,
  code_length: 6,
  resend_cooldown_seconds: 30,
};

const EXISTING_SESSION: ExistingSessionInfo = {
  deviceName: 'MacBook Pro',
  browser: 'Safari',
  lastActivityAt: '2026-09-10T10:00:00+00:00',
};

function makeEndpoints(overrides: Partial<LoginFlowEndpoints> = {}): LoginFlowEndpoints {
  return {
    login: jest.fn().mockResolvedValue({
      outcome: 'authenticated',
      user: USER,
      sessionId: 'session-1',
    }),
    replaceSession: jest.fn().mockResolvedValue({ user: USER, sessionId: 'session-2' }),
    twoFactorChallenge: jest.fn().mockResolvedValue({
      outcome: 'authenticated',
      user: USER,
      sessionId: 'session-3',
    }),
    twoFactorResend: jest.fn().mockResolvedValue(CHALLENGE),
    ...overrides,
  };
}

function apiError(status: number, json: unknown = {}): Error & { status: number; json: unknown } {
  return Object.assign(new Error('api'), { status, json });
}

describe('useLoginFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterReplace.mockReset();
    sessionStorage.clear();
    mockResolveRedirectPath.mockReturnValue('/dashboard');

    (useAuthStore as unknown as jest.Mock).mockImplementation(
      (selector: (s: { setAuth: jest.Mock }) => unknown) => selector({ setAuth: mockSetAuth }),
    );
  });

  // --- Étape mot de passe ---

  it('ouvre la session quand le mot de passe suffit', async () => {
    const endpoints = makeEndpoints();
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'alex@example.com', password: 'secret' });
    });

    expect(endpoints.login).toHaveBeenCalledWith('alex@example.com', 'secret');
    // Le cache est vidé AVANT setAuth : aucun rendu ne doit voir les données du
    // compte précédent avec la nouvelle identité.
    expect(mockClearSessionCache).toHaveBeenCalled();
    expect(mockSetAuth).toHaveBeenCalledWith(USER, 'session-1');
    expect(mockRouterReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('affiche l’étape OTP sans ouvrir de session', async () => {
    const endpoints = makeEndpoints({
      login: jest.fn().mockResolvedValue({ outcome: 'two_factor_required', challenge: CHALLENGE }),
    });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'a@b.c', password: 'x' });
    });

    expect(result.current.challenge).toEqual(CHALLENGE);
    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('bascule sur le conflit de session sans ouvrir de session', async () => {
    const endpoints = makeEndpoints({
      login: jest.fn().mockResolvedValue({
        outcome: 'session_conflict',
        existingSession: EXISTING_SESSION,
        replacementToken: 'replacement-1',
      }),
    });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'a@b.c', password: 'x' });
    });

    expect(result.current.sessionConflict).toEqual({
      existingSession: EXISTING_SESSION,
      replacementToken: 'replacement-1',
    });
    expect(mockSetAuth).not.toHaveBeenCalled();
  });

  // --- Discrimination des erreurs de login ---

  it('distingue un compte bloqué d’une erreur de saisie', async () => {
    const endpoints = makeEndpoints({ login: jest.fn().mockRejectedValue(apiError(423)) });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'a@b.c', password: 'x' });
    });

    expect(result.current.serverError).toContain('bloqué');
    expect(result.current.serverError).not.toContain('Email ou mot de passe incorrect');
  });

  it('présente un 401 comme des identifiants incorrects', async () => {
    const endpoints = makeEndpoints({ login: jest.fn().mockRejectedValue(apiError(401)) });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'a@b.c', password: 'x' });
    });

    expect(result.current.serverError).toBe('Email ou mot de passe incorrect.');
  });

  // --- Étape 2FA ---

  it('ouvre la session après validation du code', async () => {
    const endpoints = makeEndpoints({
      login: jest.fn().mockResolvedValue({ outcome: 'two_factor_required', challenge: CHALLENGE }),
    });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'a@b.c', password: 'x' });
    });
    await act(async () => {
      await result.current.verifyTwoFactor({ code: '123456', trustDevice: true });
    });

    expect(endpoints.twoFactorChallenge).toHaveBeenCalledWith({
      challenge_token: 'challenge-token-1',
      code: '123456',
      trust_device: true,
    });
    expect(mockSetAuth).toHaveBeenCalledWith(USER, 'session-3');
  });

  it('ferme l’étape OTP et montre le conflit quand une session est déjà active', async () => {
    // Le chemin le plus tordu : le conflit surgit APRÈS que le code a été validé.
    // Laisser le challenge ouvert afficherait les deux écrans simultanément.
    const endpoints = makeEndpoints({
      login: jest.fn().mockResolvedValue({ outcome: 'two_factor_required', challenge: CHALLENGE }),
      twoFactorChallenge: jest.fn().mockResolvedValue({
        outcome: 'session_conflict',
        existingSession: EXISTING_SESSION,
        replacementToken: 'replacement-2',
      }),
    });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'a@b.c', password: 'x' });
    });
    await act(async () => {
      await result.current.verifyTwoFactor({ code: '123456', trustDevice: false });
    });

    expect(result.current.challenge).toBeNull();
    expect(result.current.sessionConflict?.replacementToken).toBe('replacement-2');
    expect(mockSetAuth).not.toHaveBeenCalled();
  });

  it('laisse remonter l’échec de validation du code', async () => {
    // TwoFactorChallengeStep mappe l'erreur lui-même : le hook ne doit pas l'avaler.
    const endpoints = makeEndpoints({
      login: jest.fn().mockResolvedValue({ outcome: 'two_factor_required', challenge: CHALLENGE }),
      twoFactorChallenge: jest.fn().mockRejectedValue(apiError(422)),
    });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'a@b.c', password: 'x' });
    });

    await expect(
      result.current.verifyTwoFactor({ code: '000000', trustDevice: false }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('renvoie le code avec le même challenge_token', async () => {
    const endpoints = makeEndpoints({
      login: jest.fn().mockResolvedValue({ outcome: 'two_factor_required', challenge: CHALLENGE }),
    });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'a@b.c', password: 'x' });
    });
    await act(async () => {
      await result.current.resendTwoFactor();
    });

    expect(endpoints.twoFactorResend).toHaveBeenCalledWith('challenge-token-1');
  });

  it('refuse un renvoi hors challenge', async () => {
    const { result } = renderHook(() => useLoginFlow(makeEndpoints()));

    await expect(result.current.resendTwoFactor()).rejects.toThrow('Aucun challenge en cours.');
  });

  it('revient à la saisie du mot de passe en abandonnant le challenge', async () => {
    const endpoints = makeEndpoints({
      login: jest.fn().mockResolvedValue({ outcome: 'two_factor_required', challenge: CHALLENGE }),
    });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'a@b.c', password: 'x' });
    });
    act(() => result.current.abandonTwoFactor('Cette vérification n’est plus valide.'));

    expect(result.current.challenge).toBeNull();
    expect(result.current.serverError).toBe('Cette vérification n’est plus valide.');
  });

  // --- Remplacement de session ---

  it('ouvre la session et ferme la modale après remplacement', async () => {
    const endpoints = makeEndpoints();
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.replaceSession('replacement-1');
    });

    expect(endpoints.replaceSession).toHaveBeenCalledWith('replacement-1');
    expect(result.current.sessionConflict).toBeNull();
    expect(mockSetAuth).toHaveBeenCalledWith(USER, 'session-2');
  });

  it('signale l’échec du remplacement et ferme la modale', async () => {
    const endpoints = makeEndpoints({
      replaceSession: jest.fn().mockRejectedValue(apiError(422)),
    });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.replaceSession('replacement-1');
    });

    expect(result.current.serverError).toBeTruthy();
    expect(result.current.sessionConflict).toBeNull();
    expect(mockSetAuth).not.toHaveBeenCalled();
  });

  it('annule le conflit sans ouvrir de session', async () => {
    const endpoints = makeEndpoints({
      login: jest.fn().mockResolvedValue({
        outcome: 'session_conflict',
        existingSession: EXISTING_SESSION,
        replacementToken: 'replacement-1',
      }),
    });
    const { result } = renderHook(() => useLoginFlow(endpoints));

    await act(async () => {
      await result.current.submit({ email: 'a@b.c', password: 'x' });
    });
    act(() => result.current.cancelSessionConflict());

    expect(result.current.sessionConflict).toBeNull();
    expect(mockSetAuth).not.toHaveBeenCalled();
  });

  // --- Message de révocation ---

  it('consomme le message de révocation posé avant la redirection', async () => {
    sessionStorage.setItem('revocation_reason', 'NEW_LOGIN');

    const { result } = renderHook(() => useLoginFlow(makeEndpoints()));

    await waitFor(() => expect(result.current.revocationMessage).toContain('autre appareil'));
    // One-shot : un rechargement ne doit pas réafficher le bandeau.
    expect(sessionStorage.getItem('revocation_reason')).toBeNull();
  });

  it('n’affiche aucun message de révocation pour une raison inconnue', async () => {
    sessionStorage.setItem('revocation_reason', 'OTHER');

    const { result } = renderHook(() => useLoginFlow(makeEndpoints()));

    await waitFor(() => expect(result.current.revocationMessage).toBeNull());
    expect(sessionStorage.getItem('revocation_reason')).toBe('OTHER');
  });
});
