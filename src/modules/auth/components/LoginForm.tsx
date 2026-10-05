'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SessionConflictModal } from '@/modules/auth/components/SessionConflictModal';
import { PasswordResetSuccessNotice } from '@/modules/auth/components/PasswordResetSuccessNotice';
import { TwoFactorChallengeStep } from '@/modules/auth/components/TwoFactorChallengeStep';
import { useLoginFlow } from '@/modules/auth/hooks/useLoginFlow';
import { resolveLogin } from '@/modules/auth/utils/loginUtils';
import { authApi } from '@/shared/api/auth.api';
import { type LoginSchema, loginSchema } from '@/shared/schemas/auth.schema';
import styles from './client-login.module.css';

interface LoginFormProps {
  resetSuccess?: boolean;
}

export function LoginForm({ resetSuccess = false }: LoginFormProps) {
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
    login: resolveLogin,
    replaceSession: authApi.replaceSession,
    twoFactorChallenge: authApi.twoFactorChallenge,
    twoFactorResend: authApi.twoFactorResend,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <>
      <section className={styles.form} aria-labelledby="login-title">
        <div>
          <h1 id="login-title" className={styles.formTitle}>
            Bon retour <br />
            parmi nous.
          </h1>

          <p className={styles.formSubtitle}>
            Retrouvez vos formations et faites le prochain pas dans votre apprentissage.
          </p>
        </div>

        {challenge ? (
          <TwoFactorChallengeStep
            challenge={challenge}
            onVerify={verifyTwoFactor}
            onResend={resendTwoFactor}
            onAbandon={abandonTwoFactor}
          />
        ) : (
          <form onSubmit={handleSubmit(submit)} className={styles.fields} noValidate>
            {resetSuccess && <PasswordResetSuccessNotice />}

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email" className={styles.fieldLabel}>
                Adresse email
              </Label>

              <Input
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="vous@exemple.com"
                className={styles.fieldInput}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password" className={styles.fieldLabel}>
                Mot de passe
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${styles.fieldInput} ${styles.passwordInput}`}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />

                <button
                  type="button"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                >
                  {showPassword ? (
                    <EyeOff size={17} aria-hidden="true" />
                  ) : (
                    <Eye size={17} aria-hidden="true" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* REMEMBER */}
            <div className={styles.options}>
              <div className={styles.remember}>
                <Checkbox id="remember" />
                <Label htmlFor="remember">Rester connecté</Label>
              </div>
              <Link href="/forgot-password" className={styles.textLink}>
                Mot de passe oublié ?
              </Link>
            </div>

            {revocationMessage && (
              <div
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700"
              >
                {revocationMessage}
              </div>
            )}

            {serverError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600"
              >
                {serverError}
              </div>
            )}

            {/* SUBMIT */}
            <Button type="submit" disabled={isSubmitting} className={styles.submit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        )}
      </section>

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
