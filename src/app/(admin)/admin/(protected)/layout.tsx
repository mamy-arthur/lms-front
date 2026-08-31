import { AdminAuthGuard } from '@/modules/admin/guards/AdminAuthGuard';
import { AdminLayout } from '@/modules/admin/layout/AdminLayout';
import { EchoProvider } from '@/shared/providers/EchoProvider';
import { SessionRevocationListener } from '@/shared/providers/SessionRevocationListener';

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <EchoProvider>
        <SessionRevocationListener />
        <AdminLayout>{children}</AdminLayout>
      </EchoProvider>
    </AdminAuthGuard>
  );
}
