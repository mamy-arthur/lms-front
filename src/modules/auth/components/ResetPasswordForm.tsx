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
      <div className="space-y-5">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
          Ce lien de réinitialisation est invalide, a expiré ou a déjà été utilisé.
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link
            href={ROUTES.auth.forgotPassword}
            className="font-semibold text-primary hover:underline"
          >
            Faire une nouvelle demande
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
      <input type="hidden" {...register('email')} />
      <input type="hidden" {...register('token')} />

      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('password')}
          />

          <button
            type="button"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>

        <div className="relative">
          <Input
            id="password_confirmation"
            type={showConfirmation ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('password_confirmation')}
          />

          <button
            type="button"
            aria-label={showConfirmation ? 'Masquer la confirmation' : 'Afficher la confirmation'}
            onClick={() => setShowConfirmation((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {errors.password_confirmation && (
          <p className="text-sm text-red-500">{errors.password_confirmation.message}</p>
        )}
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
            Réinitialisation...
          </>
        ) : (
          <>
            Réinitialiser le mot de passe
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
