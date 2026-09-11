'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SessionConflictModal } from '@/modules/auth/components/SessionConflictModal';
import { TwoFactorChallengeStep } from '@/modules/auth/components/TwoFactorChallengeStep';
import { useLoginFlow } from '@/modules/auth/hooks/useLoginFlow';
import { authApi } from '@/shared/api/auth.api';
import { ROUTES } from '@/shared/constants/routes';
import { type LoginSchema, loginSchema } from '@/shared/schemas/auth.schema';

export function PlatformLoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    serverError,
    revocationMessage,
    challenge,
    sessionConflict,
    submit,
    verifyTwoFactor,
    resendTwoFactor,
    abandonTwoFactor,
    replaceSession,
    cancelSessionConflict,
  } = useLoginFlow({
    login: authApi.platformLogin,
    replaceSession: authApi.platformReplaceSession,
    twoFactorChallenge: authApi.platformTwoFactorChallenge,
    twoFactorResend: authApi.platformTwoFactorResend,
  });

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (challenge) {
    return (
      <TwoFactorChallengeStep
        challenge={challenge}
        onVerify={verifyTwoFactor}
        onResend={resendTwoFactor}
        onAbandon={abandonTwoFactor}
        forgotPasswordHref={ROUTES.platform.forgotPassword}
      />
    );
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(submit)} className="mt-8 space-y-5">
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
          onCancel={cancelSessionConflict}
          onConfirm={replaceSession}
        />
      )}
    </>
  );
}
