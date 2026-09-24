'use client';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { EditorDashboard } from './EditorDashboard';

export function DynamicDashboard() {
  const role = useAuthStore((s) => s.role);
  if (role === Role.SUPER_ADMIN) return <SuperAdminDashboard />;
  if (role === Role.EDITOR) return <EditorDashboard />;
  // Tout autre rôle est en cours de redirection par AdminAuthGuard.
  return <LoadingSpinner className="h-screen" />;
}
