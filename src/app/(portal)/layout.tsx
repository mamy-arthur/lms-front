"use client";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/modules/auth/guards/AuthGuard";
import { AppSidebar } from "@/modules/shared/layout/AppSidebar";
import { PORTAL_NAV } from "@/modules/portal/config/navigation";
import { useAuthStore } from "@/shared/stores/auth.store";
import { useTenant } from "@/shared/hooks/useTenant";
import { authApi } from "@/shared/api/auth.api";
import { ROUTES } from "@/shared/constants/routes";

function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { logoUrl, tenantName } = useTenant();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      useAuthStore.getState().clearAuth();
      router.push(ROUTES.auth.login);
    }
  };

  return (
    <AppSidebar
      navItems={PORTAL_NAV}
      user={user}
      logoUrl={logoUrl}
      tenantName={tenantName}
      onLogout={handleLogout}
    >
      {children}
    </AppSidebar>
  );
}

export default function PortalRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PortalLayout>{children}</PortalLayout>
    </AuthGuard>
  );
}
