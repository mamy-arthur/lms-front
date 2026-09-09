'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginSchema, type LoginSchema } from '@/shared/schemas/auth.schema';
import {
  authApi,
  type ExistingSessionInfo,
  type SessionResult,
  type TwoFactorChallenge,
} from '@/shared/api/auth.api';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { SessionConflictModal } from '@/modules/auth/components/SessionConflictModal';
import { resolveRedirectPath, clearSessionCache } from '@/modules/auth/utils/loginUtils';
import { TwoFactorChallengeStep } from '@/modules/auth/components/TwoFactorChallengeStep';
import type { AuthUser } from '@/shared/types/auth.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PlatformLoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [sessionConflict, setSessionConflict] = useState<{
    existingSession: ExistingSessionInfo;
    replacementToken: string;
  } | null>(null);

  // Read one-shot revocation message set by useSessionRevocation after redirect
  const [revocationMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const reason = sessionStorage.getItem('revocation_reason');
    if (reason === 'NEW_LOGIN') {
      sessionStorage.removeItem('revocation_reason');
      return "Votre session a été fermée car votre compte vient d'être connecté depuis un autre appareil.";
    }
    return null;
  });

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const enterSession = (user: AuthUser, sessionId: string) => {
    const hasTenant = !!useTenantStore.getState().tenant;

    clearSessionCache();
    setAuth(user, sessionId);

    router.replace(resolveRedirectPath(user, hasTenant));
  };

  /** Ouvre la session, ou bascule sur la modale de conflit si une autre est déjà active. */
  const applySessionResult = (result: SessionResult) => {
    if (result.outcome === 'session_conflict') {
      setChallenge(null);
      setSessionConflict({
        existingSession: result.existingSession,
        replacementToken: result.replacementToken,
      });

      return;
    }

    enterSession(result.user, result.sessionId);
  };

  const onSubmit = async (data: LoginSchema) => {
    setServerError(null);

    try {
      const result = await authApi.platformLogin(data.email, data.password);

      if (result.outcome === 'two_factor_required') {
        setChallenge(result.challenge);

        return;
      }

      applySessionResult(result);
    } catch {
      setServerError('Email ou mot de passe incorrect.');
    }
  };

  const handleReplaceSession = async (token: string) => {
    try {
      const result = await authApi.platformReplaceSession(token);
      setSessionConflict(null);
      enterSession(result.user, result.sessionId);
    } catch {
      setServerError('La tentative de connexion a échoué. Veuillez réessayer.');
      setSessionConflict(null);
    }
  };

  if (challenge) {
    return (
      <TwoFactorChallengeStep
        challenge={challenge}
        onVerify={async ({ code, trustDevice }) => {
          applySessionResult(
            await authApi.platformTwoFactorChallenge({
              challenge_token: challenge.challenge_token,
              code,
              trust_device: trustDevice,
            }),
          );
        }}
        onResend={() => authApi.platformTwoFactorResend(challenge.challenge_token)}
        onAbandon={(reason) => {
          setChallenge(null);
          setServerError(reason ?? null);
        }}
      />
    );
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="platform-email">Email</Label>

          <Input id="platform-email" placeholder="vous@learneo.local" {...form.register('email')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="platform-password">Mot de passe</Label>

          <div className="relative">
            <Input
              id="platform-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...form.register('password')}
            />

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {form.formState.errors.password && (
            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        {revocationMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {revocationMessage}
          </div>
        )}

        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {serverError}
          </div>
        )}

        <div className="flex w-full">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-10 w-full bg-(--color-primary) px-8 hover:bg-(--color-primary)/80"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                Se connecter
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>

      {sessionConflict && (
        <SessionConflictModal
          isOpen
          existingSession={sessionConflict.existingSession}
          replacementToken={sessionConflict.replacementToken}
          onCancel={() => setSessionConflict(null)}
          onConfirm={handleReplaceSession}
        />
      )}
    </>
  );
}
