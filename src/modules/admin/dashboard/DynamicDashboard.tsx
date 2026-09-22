'use client';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { EditorDashboard } from './EditorDashboard';

export function DynamicDashboard() {
  const role = useAuthStore((s) => s.role);
  if (role === Role.SUPER_ADMIN) return <SuperAdminDashboard />;
  if (role === Role.EDITOR) return <EditorDashboard />;
  return null;
}
