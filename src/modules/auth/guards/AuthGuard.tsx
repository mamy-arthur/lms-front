"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";
import { LoadingSpinner } from "@/shared/components/feedback/LoadingSpinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  // Zustand v5 persist hydrates localStorage asynchronously.
  // We must wait for hydration to complete before checking auth,
  // otherwise we redirect on the first render before the token is restored.
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (hydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    // In case hydration already finished between the useState init and this effect
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);

  // Any authenticated user (regardless of role) can access portal pages.
  // Role-based redirect happens at login time via resolveRedirectPath.
  const isAuthenticated = hydrated && !!token && !!user;

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace(ROUTES.auth.login);
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated)
    return <LoadingSpinner className="h-screen" />;
  return <>{children}</>;
}
