'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CertificateSearch,
  CertificatesFilter,
  CertificatePreviewDialog,
} from '@modules/shared/components/certificates';
import { useAllTenantsQuery } from '@/modules/shared/hooks/useAllTenantsQuery';
import { useModuleListController } from '@/modules/shared/hooks/useModuleListController';
import { usePortalCertificatesQuery } from '../hooks/usePortalCertificatesQuery';
import { useDeletePortalCertificate } from '../hooks/useDeletePortalCertificate';
import type { Certificate } from '../types';
import { PortalCertificateFormDrawer } from './_components/portal-certificate-form-drawer';
import { PortalCertificatesTable } from './_components/portal-certificates-table';

export function PortalCertificatesList() {
  const ctrl = useModuleListController<Certificate>({
    includeTenantFilter: true,
    defaultPageSize: 25,
  });

  const { data: tenantsData } = useAllTenantsQuery();
  const tenants = tenantsData?.data ?? [];

  const { data, isLoading } = usePortalCertificatesQuery(ctrl.params);
  const deleteMutation = useDeletePortalCertificate();
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  return (
    <div className="bg-background">
      <header className="mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attestations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez, modifiez et organisez les modèles d'attestation.
          </p>
        </div>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <CertificateSearch
          value={ctrl.draftSearch}
          onChange={ctrl.setDraftSearch}
          onSearch={ctrl.handleSearch}
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <CertificatesFilter
            statusFilter={ctrl.draftCategory[0] ?? 'all'}
            tenantFilter={ctrl.draftTenant}
            onStatusFilterChange={(v) => ctrl.setDraftCategory([v])}
            onTenantFilterChange={ctrl.setDraftTenant}
            onSearch={ctrl.handleSearch}
            tenants={tenants}
            showTenantFilter={false}
          />
          <Button
            onClick={ctrl.handleOpenCreate}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
          >
            <Plus className="size-4" />
            Nouvelle attestation
          </Button>
        </div>
      </div>

      <PortalCertificatesTable
        certificates={data?.data ?? []}
        isLoading={isLoading}
        hasQuery={ctrl.hasQuery}
        page={ctrl.page}
        pageSize={ctrl.pageSize}
        total={data?.total ?? 0}
        sort={ctrl.sort}
        onSort={ctrl.handleSort}
        onPageChange={ctrl.handlePageChange}
        onPageSizeChange={ctrl.handlePageSizeChange}
        onEdit={ctrl.handleEdit}
        onDelete={(cert) => deleteMutation.mutate(cert.id)}
        onPreview={setPreviewCert}
      />

      <PortalCertificateFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        certificate={ctrl.editingModule as Certificate | undefined}
      />

      {previewCert && (
        <CertificatePreviewDialog
          open={!!previewCert}
          onClose={() => setPreviewCert(null)}
          name={previewCert.name}
          reference={previewCert.reference}
          body={previewCert.body}
        />
      )}
    </div>
  );
}
