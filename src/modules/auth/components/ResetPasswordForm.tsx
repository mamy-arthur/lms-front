'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordSchema } from '@/shared/schemas/auth.schema';
import { authApi } from '@/shared/api/auth.api';
import { mapPasswordResetError } from '@/modules/auth/lib/passwordResetErrors';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import styles from './client-login.module.css';

interface ResetPasswordFormProps {
  email: string;
  token: string;
}

export function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email, token },
  });

  const onSubmit = async (data: ResetPasswordSchema) => {
    setServerError(null);
    try {
      await authApi.resetPassword(data);
      router.replace(`${ROUTES.auth.login}?reset=1`);
    } catch (err) {
      const mapped = mapPasswordResetError(err);

      if (mapped.kind === 'invalid_token') {
        setLinkExpired(true);
        return;
      }

      if (mapped.kind === 'invalid_password') {
        setError('password', { message: mapped.message });
        return;
      }

      setServerError(mapped.message);
    }
  };

  if (linkExpired) {
    return (
      <div className={styles.fields}>
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600"
        >
          Ce lien de réinitialisation est invalide, a expiré ou a déjà été utilisé.
        </div>

        <p className={styles.accessRequest}>
          <Link href={ROUTES.auth.forgotPassword} className={styles.textLink}>
            Faire une nouvelle demande
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.fields}>
      <input type="hidden" {...register('email')} />
      <input type="hidden" {...register('token')} />

      <div className="space-y-2">
        <Label htmlFor="password" className={styles.fieldLabel}>
          Nouveau mot de passe
        </Label>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
            onClick={() => setShowPassword((visible) => !visible)}
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

      <div className="space-y-2">
        <Label htmlFor="password_confirmation" className={styles.fieldLabel}>
          Confirmer le mot de passe
        </Label>

        <div className="relative">
          <Input
            id="password_confirmation"
            type={showConfirmation ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={`${styles.fieldInput} ${styles.passwordInput}`}
            aria-invalid={Boolean(errors.password_confirmation)}
            aria-describedby={
              errors.password_confirmation ? 'password-confirmation-error' : undefined
            }
            {...register('password_confirmation')}
          />

          <button
            type="button"
            aria-label={showConfirmation ? 'Masquer la confirmation' : 'Afficher la confirmation'}
            aria-pressed={showConfirmation}
            aria-controls="password_confirmation"
            onClick={() => setShowConfirmation((visible) => !visible)}
            className={styles.passwordToggle}
          >
            {showConfirmation ? (
              <EyeOff size={17} aria-hidden="true" />
            ) : (
              <Eye size={17} aria-hidden="true" />
            )}
          </button>
        </div>

        {errors.password_confirmation && (
          <p id="password-confirmation-error" role="alert" className="text-xs text-red-600">
            {errors.password_confirmation.message}
          </p>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600"
        >
          {serverError}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className={styles.submit}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Réinitialisation...
          </>
        ) : (
          <>
            Réinitialiser le mot de passe
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
