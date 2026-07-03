'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/auth.store';
import { ROUTES } from '@/shared/constants/routes';
import { PLATFORM_ROLES } from '@/shared/constants/roles';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

/**
 * Protège les pages admin.
 * Seuls SUPER_ADMIN et EDITOR (PLATFORM_ROLES) peuvent y accéder.
 * Redirige vers /admin/login sinon.
 */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);

  const isAuthenticated = hydrated && !!user && PLATFORM_ROLES.includes(user.role);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace(ROUTES.platform.login);
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return <LoadingSpinner className="h-screen" />;

  return <>{children}</>;
}
