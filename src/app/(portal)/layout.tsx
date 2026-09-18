'use client';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/modules/auth/guards/AuthGuard';
import { PORTAL_NAV } from '@/modules/portal/config/navigation';
import { LayoutSideBar } from '@/modules/shared/layout/AppSidebar';
import { authApi } from '@/shared/api/auth.api';
import { ROUTES } from '@/shared/constants/routes';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { useTenant } from '@/shared/hooks/useTenant';
import { resetEcho } from '@/shared/lib/echo';
import { EchoProvider } from '@/shared/providers/EchoProvider';
import { SessionRevocationListener } from '@/shared/providers/SessionRevocationListener';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationUser } from '@/shared/simulation/useSimulationUser';
import { endSimulation } from '@/shared/simulation/service';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import { toast } from 'sonner';

function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useSimulationUser();
  const { can } = usePermissions();
  const { logoUrl, tenantName } = useTenant();

  const navItems = PORTAL_NAV.filter((item) => !item.access || can(item.access));

  const handleLogout = async () => {
    if (useSimulationStore.getState().phase === 'transition') return;
    if (useAuthStore.getState().simulatedRole) {
      try {
        router.replace(await endSimulation());
      } catch {
        toast.error('Impossible de quitter la simulation. Veuillez réessayer.');
      }
      return;
    }
    try {
      await authApi.logout();
    } finally {
      resetEcho();
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
      <EchoProvider>
        <SessionRevocationListener />
        <PortalLayout>{children}</PortalLayout>
      </EchoProvider>
    </AuthGuard>
  );
}
