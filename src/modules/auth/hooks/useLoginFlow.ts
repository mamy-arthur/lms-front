'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getLoginErrorMessage } from '@/modules/auth/lib/loginErrors';
import { clearSessionCache, resolveRedirectPath } from '@/modules/auth/utils/loginUtils';
import type {
  ExistingSessionInfo,
  LoginResult,
  SessionResult,
  TwoFactorChallenge,
  TwoFactorChallengePayload,
} from '@/shared/api/auth.api';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import type { AuthUser } from '@/shared/types/auth.types';

/** Les deux parcours de connexion ne diffèrent que par leurs endpoints. */
export interface LoginFlowEndpoints {
  login: (email: string, password: string) => Promise<LoginResult>;
  replaceSession: (replacementToken: string) => Promise<{ user: AuthUser; sessionId: string }>;
  twoFactorChallenge: (payload: TwoFactorChallengePayload) => Promise<SessionResult>;
  twoFactorResend: (challengeToken: string) => Promise<TwoFactorChallenge>;
}

interface SessionConflictState {
  existingSession: ExistingSessionInfo;
  replacementToken: string;
}

/**
 * Parcours de connexion complet : mot de passe, challenge 2FA, conflit de session
 * et message de révocation. Mutualisé entre le login tenant et le login plateforme.
 */
export function useLoginFlow(endpoints: LoginFlowEndpoints) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [serverError, setServerError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [sessionConflict, setSessionConflict] = useState<SessionConflictState | null>(null);
  const [revocationMessage, setRevocationMessage] = useState<string | null>(null);

  // Message one-shot posé par useSessionRevocation avant la redirection. Lu après
  // le montage : sessionStorage n'existe pas au prérendu serveur, et le lire
  // pendant le rendu produirait deux arbres différents à l'hydratation.
  useEffect(() => {
    if (sessionStorage.getItem('revocation_reason') !== 'NEW_LOGIN') return;

    sessionStorage.removeItem('revocation_reason');
    setRevocationMessage(
      "Votre session a été fermée car votre compte vient d'être connecté depuis un autre appareil.",
    );
  }, []);

  const enterSession = useCallback(
    (user: AuthUser, sessionId: string) => {
      const hasTenant = !!useTenantStore.getState().tenant;

      clearSessionCache();
      setAuth(user, sessionId);

      router.replace(resolveRedirectPath(user, hasTenant));
    },
    [router, setAuth],
  );

  /** Ouvre la session, ou bascule sur la modale de conflit si une autre est déjà active. */
  const applySessionResult = useCallback(
    (result: SessionResult) => {
      if (result.outcome === 'session_conflict') {
        setChallenge(null);
        setSessionConflict({
          existingSession: result.existingSession,
          replacementToken: result.replacementToken,
        });

        return;
      }

      enterSession(result.user, result.sessionId);
    },
    [enterSession],
  );

  const submit = async ({ email, password }: { email: string; password: string }) => {
    setServerError(null);

    try {
      const result = await endpoints.login(email, password);

      if (result.outcome === 'two_factor_required') {
        setChallenge(result.challenge);

        return;
      }

      applySessionResult(result);
    } catch (err) {
      setServerError(getLoginErrorMessage(err));
    }
  };

  const verifyTwoFactor = async ({ code, trustDevice }: { code: string; trustDevice: boolean }) => {
    if (!challenge) return;

    applySessionResult(
      await endpoints.twoFactorChallenge({
        challenge_token: challenge.challenge_token,
        code,
        trust_device: trustDevice,
      }),
    );
  };

  const resendTwoFactor = () => {
    if (!challenge) return Promise.reject(new Error('Aucun challenge en cours.'));

    return endpoints.twoFactorResend(challenge.challenge_token);
  };

  const abandonTwoFactor = (reason?: string) => {
    setChallenge(null);
    setServerError(reason ?? null);
  };

  const replaceSession = async (replacementToken: string) => {
    try {
      const result = await endpoints.replaceSession(replacementToken);
      setSessionConflict(null);
      enterSession(result.user, result.sessionId);
    } catch (err) {
      setServerError(
        getApiErrorMessage(err, 'La tentative de connexion a échoué. Veuillez réessayer.'),
      );
      setSessionConflict(null);
    }
  };

  return {
    serverError,
    revocationMessage,
    challenge,
    sessionConflict,
    submit,
    verifyTwoFactor,
    resendTwoFactor,
    abandonTwoFactor,
    replaceSession,
    cancelSessionConflict: () => setSessionConflict(null),
  };
}
