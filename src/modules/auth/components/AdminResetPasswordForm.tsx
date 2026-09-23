'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { resetPasswordSchema, type ResetPasswordSchema } from '@/shared/schemas/auth.schema';
import { authApi } from '@/shared/api/auth.api';
import { mapPasswordResetError } from '@/modules/auth/lib/passwordResetErrors';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams?.get('token') ?? '';
  const email = searchParams?.get('email') ?? '';

  const [serverError, setServerError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      token,
      password: '',
      password_confirmation: '',
    },
  });

  if (!token || !email) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        Lien invalide ou expiré. Veuillez redemander un lien de réinitialisation.
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordSchema) => {
    setServerError(null);

    try {
      await authApi.platformResetPassword(data);

      router.push(`${ROUTES.platform.login}?reset=1`);
    } catch (err) {
      const mapped = mapPasswordResetError(err);

      if (mapped.kind === 'invalid_token') {
        setLinkExpired(true);
        return;
      }

      if (mapped.kind === 'invalid_password') {
        form.setError('password', { message: mapped.message });
        return;
      }

      setServerError(mapped.message);
    }
  };

  if (linkExpired) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Ce lien de réinitialisation est invalide, a expiré ou a déjà été utilisé.
        </div>

        <div className="text-center">
          <Link
            href={ROUTES.platform.forgotPassword}
            className="text-sm text-primary hover:underline"
          >
            Faire une nouvelle demande
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
        <Label htmlFor="password">Nouveau mot de passe</Label>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...form.register('password')}
            className="h-12 pr-12"
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {form.formState.errors.password && (
          <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>

        <div className="relative">
          <Input
            id="password_confirmation"
            type={showConfirmation ? 'text' : 'password'}
            placeholder="••••••••"
            {...form.register('password_confirmation')}
            className="h-12 pr-12"
          />

          <button
            type="button"
            onClick={() => setShowConfirmation((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {form.formState.errors.password_confirmation && (
          <p className="text-sm text-red-500">
            {form.formState.errors.password_confirmation.message}
          </p>
        )}
      </div>

      <input type="hidden" {...form.register('token')} />

      <input type="hidden" {...form.register('email')} />

      <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Réinitialisation...
          </>
        ) : (
          'Réinitialiser'
        )}
      </Button>
    </form>
  );
}
