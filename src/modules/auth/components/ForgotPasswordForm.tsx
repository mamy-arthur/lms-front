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

  if (submitted) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700">
          Un lien de réinitialisation a été envoyé à <strong>{getValues('email')}</strong>. Pensez à
          vérifier vos spams.
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href={ROUTES.auth.login} className="font-semibold text-primary hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>

        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          {...register('email')}
        />

        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full bg-(--color-primary) hover:bg-(--color-primary)/80"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Envoi...
          </>
        ) : (
          <>
            Envoyer le lien
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        <Link href={ROUTES.auth.login} className="font-semibold text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
