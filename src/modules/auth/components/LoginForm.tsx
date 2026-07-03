'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react';

import { loginSchema, type LoginSchema } from '@/shared/schemas/auth.schema';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { resolveLogin, resolveRedirectPath } from '@/modules/auth/utils/loginUtils';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    setServerError(null);

    try {
      const hasTenant = !!useTenantStore.getState().tenant;

      const { user } = await resolveLogin(data.email, data.password);

      setAuth(user);

      router.replace(resolveRedirectPath(user, hasTenant));
    } catch {
      setServerError('Email ou mot de passe incorrect.');
    }
  };

  return (
    <section className="flex items-center justify-center px-6 py-10 sm:px-10">
      <div className="w-full max-w-md">
        {/* MOBILE LOGO */}
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-primary) text-white">
            <GraduationCap className="h-6 w-6" />
          </div>

          <div>
            <h2 className="font-bold">LearnHub LMS</h2>
            <p className="text-xs text-muted-foreground">Learning Platform</p>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Bon retour 👋</h1>

          <p className="mt-2 text-muted-foreground text-sm">
            Connectez-vous à votre espace d'apprentissage.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          {/* EMAIL */}
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>

            <Input id="email" placeholder="vous@exemple.com" {...register('email')} />
          </div>

          {/* PASSWORD */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="password">Mot de passe</Label>

              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          {/* REMEMBER */}
          <div className="flex items-center gap-3">
            <Checkbox id="remember" />

            <Label htmlFor="remember" className="cursor-pointer font-normal">
              Rester connecté
            </Label>
          </div>

          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
              {serverError}
            </div>
          )}

          {/* SUBMIT */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            {isSubmitting ? (
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
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Demander un accès
          </Link>
        </p>
      </div>
    </section>
  );
}
