'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { forgotPasswordSchema, type ForgotPasswordSchema } from '@/shared/schemas/auth.schema';
import { authApi } from '@/shared/api/auth.api';
import { mapPasswordResetError } from '@/modules/auth/lib/passwordResetErrors';
import { ROUTES } from '@/shared/constants/routes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setServerError(null);

    try {
      await authApi.platformForgotPassword(data.email);
      setSubmitted(true);
    } catch (err) {
      setServerError(mapPasswordResetError(err).message);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Un email a été envoyé à <span className="font-semibold">{form.getValues('email')}</span>.
        </div>

        <div className="text-center">
          <Link href={ROUTES.platform.login} className="text-sm text-primary hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>

        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          {...form.register('email')}
          className="h-12"
        />

        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Envoi...
          </>
        ) : (
          'Envoyer le lien'
        )}
      </Button>

      <div className="text-center">
        <Link href={ROUTES.platform.login} className="text-sm text-primary hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
