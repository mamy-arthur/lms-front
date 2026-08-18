'use client';

import { redirect } from 'next/navigation';
import ClientDashboard from '@/modules/portal/resources/dashboard/ClientDashboard';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';

export default function DashboardPage() {
  const role = useAuthStore((s) => s.role);

  if (role === Role.TRAINEE) {
    redirect(ROUTES.portal.traineeFormations);
  }

  return <ClientDashboard />;
}
