'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { forgotPasswordSchema, type ForgotPasswordSchema } from '@/shared/schemas/auth.schema';
import { authApi } from '@/shared/api/auth.api';
import { mapPasswordResetError } from '@/modules/auth/lib/passwordResetErrors';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/components/ui/Button/Button';
import { cn } from '@/shared/lib/cn';

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
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Un lien de réinitialisation a été envoyé à <strong>{getValues('email')}</strong>. Pensez à
          vérifier vos spams.
        </div>
        <Link
          href={ROUTES.auth.login}
          className="block text-center text-sm text-blue-600 hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none',
            'placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          )}
          placeholder="vous@exemple.com"
        />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Envoyer le lien
      </Button>

      <Link
        href={ROUTES.auth.login}
        className="block text-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← Retour à la connexion
      </Link>
    </form>
  );
}
