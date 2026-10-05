'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';

import { forgotPasswordSchema, type ForgotPasswordSchema } from '@/shared/schemas/auth.schema';
import { authApi } from '@/shared/api/auth.api';
import { mapPasswordResetError } from '@/modules/auth/lib/passwordResetErrors';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import styles from './client-login.module.css';

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data.email);
      setSubmitted(true);
    } catch (err) {
      setServerError(mapPasswordResetError(err).message);
    }
  };

  return (
    <>
      {submitted ? (
        <div className={styles.fields}>
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700"
          >
            Un lien de réinitialisation a été envoyé à <strong>{getValues('email')}</strong>. Pensez
            à vérifier vos spams.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.fields}>
          <div className="space-y-2">
            <Label htmlFor="email" className={styles.fieldLabel}>
              Adresse email
            </Label>

            <Input
              id="email"
              type="email"
              autoComplete="email"
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
                Envoi...
              </>
            ) : (
              <>
                Envoyer le lien
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
      )}

      <p className={styles.accessRequest}>
        <Link href={ROUTES.auth.login} className={styles.textLink}>
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
