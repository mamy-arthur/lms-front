'use client';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/modules/auth/guards/AuthGuard';
import { LayoutSideBar } from '@/modules/shared/layout/AppSidebar';
import { PORTAL_NAV } from '@/modules/portal/config/navigation';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenant } from '@/shared/hooks/useTenant';
import { authApi } from '@/shared/api/auth.api';
import { ROUTES } from '@/shared/constants/routes';
import { usePermissions } from '@/shared/hooks/usePermissions';

function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { can } = usePermissions();
  const { logoUrl, tenantName } = useTenant();

  const navItems = PORTAL_NAV.filter((item) => !item.access || can(item.access));

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      useAuthStore.getState().clearAuth();
      router.push(ROUTES.auth.login);
    }
  };

  return (
    <LayoutSideBar
      navItems={navItems}
      user={user}
      logoUrl={logoUrl}
      tenantName={tenantName}
      onLogout={handleLogout}
    >
      {children}
    </LayoutSideBar>
  );
}

export default function PortalRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PortalLayout>{children}</PortalLayout>
    </AuthGuard>
  );
}
