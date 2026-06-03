"use client";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/modules/shared/layout/AppSidebar";
import { ADMIN_NAV } from "@/modules/admin/config/navigation";
import { useAuthStore } from "@/shared/stores/auth.store";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { authApi } from "@/shared/api/auth.api";
import { useTenant } from "@/shared/hooks/useTenant";
import { ROUTES } from "@/shared/constants/routes";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { can } = usePermissions();
  const { logoUrl, tenantName } = useTenant();

  const navItems = ADMIN_NAV.filter((item) =>
    !item.access || can(item.access),
  );

  const handleLogout = async () => {
    try {
      await authApi.platformLogout();
    } finally {
      useAuthStore.getState().clearAuth();
      router.push(ROUTES.platform.login);
    }
  };

  return (
    <AppSidebar
      navItems={navItems}
      user={user}
      logoUrl={logoUrl}
      tenantName={tenantName}
      onLogout={handleLogout}
    >
      {children}
    </AppSidebar>
  );
}
