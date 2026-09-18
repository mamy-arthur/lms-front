'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/auth.store';
import { ROUTES } from '@/shared/constants/routes';
import { PLATFORM_ROLES } from '@/shared/constants/roles';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { roleHome } from '@/shared/simulation/simulation.store';

/**
 * Protège les pages admin.
 * Seuls SUPER_ADMIN et EDITOR (PLATFORM_ROLES) peuvent y accéder.
 * Redirige un utilisateur connecté vers l'accueil de son rôle effectif.
 */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);

  const isAuthenticated = hydrated && !!user;
  const isAuthorized = isAuthenticated && role !== null && PLATFORM_ROLES.includes(role);

  useEffect(() => {
    if (hydrated && !isAuthorized) {
      router.replace(isAuthenticated ? roleHome(role) : ROUTES.platform.login);
    }
  }, [hydrated, isAuthenticated, isAuthorized, role, router]);

  if (!hydrated || !isAuthorized) return <LoadingSpinner className="h-screen" />;

  return <>{children}</>;
}
