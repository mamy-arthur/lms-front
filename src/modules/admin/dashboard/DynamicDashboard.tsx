'use client';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { ClientManagerDashboard } from './ClientManagerDashboard';

export function DynamicDashboard() {
  const role = useAuthStore((s) => s.role);
  return role === Role.SUPER_ADMIN ? <SuperAdminDashboard /> : <ClientManagerDashboard />;
}
