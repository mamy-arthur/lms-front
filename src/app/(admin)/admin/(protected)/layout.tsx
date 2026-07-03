import { AdminAuthGuard } from '@/modules/admin/guards/AdminAuthGuard';
import { AdminLayout } from '@/modules/admin/layout/AdminLayout';

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminAuthGuard>
  );
}
