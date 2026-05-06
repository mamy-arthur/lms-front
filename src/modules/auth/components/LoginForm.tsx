"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { loginSchema, type LoginSchema } from "@/shared/schemas/auth.schema";
import { authApi } from "@/shared/api/auth.api";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ADMIN_ROLES } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/shared/components/ui/Button/Button";
import { cn } from "@/shared/lib/cn";

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setServerError(null);
    try {
      const { token, user } = await authApi.login(data.email, data.password);
      setAuth({ token, user });
      const dest = ADMIN_ROLES.includes(user.role) ? ROUTES.admin.root : ROUTES.portal.dashboard;
      router.replace(dest);
    } catch {
      setServerError("Email ou mot de passe incorrect.");
    }
  };

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
          {...register("email")}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none",
            "placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            errors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          )}
          placeholder="vous@exemple.com"
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mot de passe
          </label>
          <Link
            href={ROUTES.auth.forgotPassword}
            className="text-xs text-blue-600 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none",
            "placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            errors.password ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          )}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Se connecter
      </Button>
    </form>
  );
}