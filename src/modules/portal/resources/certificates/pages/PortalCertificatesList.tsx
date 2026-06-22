"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CertificateSearch } from "@modules/shared/components/certificates";
import { useAllTenantsQuery } from "@/modules/shared/hooks/useAllTenantsQuery";
import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { usePortalCertificatesQuery } from "../hooks/usePortalCertificatesQuery";
import type { Certificate } from "../types";
import { AdminCertificatesFilter } from "@/modules/admin/resources/certificates/pages/_components/admin-certificates-filter";
import { PortalCertificateFormDrawer } from "./_components/portal-certificate-form-drawer";
import { PortalCertificatesTable } from "./_components/portal-certificates-table";

export function PortalCertificatesList() {
  const ctrl = useModuleListController<Certificate>({
    includeTenantFilter: true,
    defaultPageSize: 25,
  });

  const { data: tenantsData } = useAllTenantsQuery();
  const tenants = tenantsData?.data ?? [];

  const { data, isLoading } = usePortalCertificatesQuery(ctrl.params);

  const tenantNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tenants) {
      map[String(t.id)] = t.name;
    }
    return map;
  }, [tenants]);

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
          <AdminCertificatesFilter
            statusFilter={ctrl.draftCategory}
            tenantFilter={ctrl.draftTenant}
            onStatusFilterChange={ctrl.setDraftCategory}
            onTenantFilterChange={ctrl.setDraftTenant}
            onSearch={ctrl.handleSearch}
            tenants={tenants}
          />
          <Button
            onClick={ctrl.handleOpenCreate}
            className="bg-(--color-primary) hover:bg-primary/80 text-primary-foreground shrink-0"
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
        onDelete={() => {}}
        tenantNames={tenantNames}
      />

      <PortalCertificateFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        certificate={ctrl.editingModule as Certificate | undefined}
        tenants={tenants}
      />
    </div>
  );
}
