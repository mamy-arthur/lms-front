'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { resetPasswordSchema, type ResetPasswordSchema } from '@/shared/schemas/auth.schema';
import { authApi } from '@/shared/api/auth.api';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/components/ui/Button/Button';
import { cn } from '@/shared/lib/cn';

interface ResetPasswordFormProps {
  email: string;
  token: string;
}

export function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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
    } catch {
      setServerError('Le lien est invalide ou a expiré. Veuillez refaire une demande.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <input type="hidden" {...register('email')} />
      <input type="hidden" {...register('token')} />

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none',
            'placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          )}
          placeholder="••••••••"
        />
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
          Confirmer le mot de passe
        </label>
        <input
          id="password_confirmation"
          type="password"
          autoComplete="new-password"
          {...register('password_confirmation')}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none',
            'placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            errors.password_confirmation ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          )}
          placeholder="••••••••"
        />
        {errors.password_confirmation && (
          <p className="text-xs text-red-600">{errors.password_confirmation.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Réinitialiser le mot de passe
      </Button>
    </form>
  );
}
