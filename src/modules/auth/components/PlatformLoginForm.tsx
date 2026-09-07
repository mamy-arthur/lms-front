'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginSchema, type LoginSchema } from '@/shared/schemas/auth.schema';
import { authApi, type TwoFactorChallenge } from '@/shared/api/auth.api';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
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

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const enterSession = (user: AuthUser) => {
    const hasTenant = !!useTenantStore.getState().tenant;

    clearSessionCache();
    setAuth(user);

    router.replace(resolveRedirectPath(user, hasTenant));
  };

  const onSubmit = async (data: LoginSchema) => {
    setServerError(null);

    try {
      const outcome = await authApi.platformLogin(data.email, data.password);

      if (outcome.kind === 'challenge') {
        setChallenge(outcome.challenge);

        return;
      }

      enterSession(outcome.user);
    } catch {
      setServerError('Email ou mot de passe incorrect.');
    }
  };

  if (challenge) {
    return (
      <TwoFactorChallengeStep
        challenge={challenge}
        onVerify={async ({ code, trustDevice }) => {
          const { user } = await authApi.platformTwoFactorChallenge({
            challenge_token: challenge.challenge_token,
            code,
            trust_device: trustDevice,
          });

          enterSession(user);
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
  );
}
