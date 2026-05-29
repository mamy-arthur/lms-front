"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/shared/stores/auth.store";
import { PLATFORM_ROLES } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";
import { LoadingSpinner } from "@/shared/components/feedback/LoadingSpinner";

export function PlatformGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (hydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);

  const isAuthorized =
    hydrated && !!token && !!user && PLATFORM_ROLES.includes(user.role);

  useEffect(() => {
    if (hydrated && !isAuthorized) router.replace(ROUTES.platform.login);
  }, [hydrated, isAuthorized, router]);

  if (!hydrated || !isAuthorized)
    return <LoadingSpinner className="h-screen" />;

  return <>{children}</>;
}
