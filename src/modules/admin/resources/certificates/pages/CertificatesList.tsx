'use client';

import {
  CertificatePreviewDialog,
  CertificateSearch,
} from '@modules/shared/components/certificates';
import { ChevronDown, Plus, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAllTenantsQuery } from '@/modules/shared/hooks/useAllTenantsQuery';
import { ConfirmDialog } from '@/shared/components/confirm-dialog/ConfirmDialog';
import { useCertificatesQuery } from '../hooks/useCertificatesQuery';
import { useDeleteCertificate } from '../hooks/useDeleteCertificate';
import type { Certificate, CertificateSearchParams } from '../types';
import { AdminCertificateFormDrawer } from './_components/admin-certificate-form-drawer';
import { AdminCertificatesTable } from './_components/admin-certificates-table';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
] as const;

export function CertificatesList() {
  const [params, setParams] = useState<CertificateSearchParams>({
    page: 0,
    page_size: 25,
    sort_by: 'name',
    sort_dir: 'asc',
  });
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | undefined>();
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [deletingItem, setDeletingItem] = useState<Certificate | null>(null);

  const { data: tenantsData } = useAllTenantsQuery();
  const tenants = tenantsData?.data ?? [];
  const { data, isLoading } = useCertificatesQuery(params);
  const deleteMutation = useDeleteCertificate();

  const tenantNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tenants) map[String(t.id)] = t.name;
    return map;
  }, [tenants]);

  const handleSearch = useCallback(() => {
    setParams((prev) => ({ ...prev, q: params.q, page: 0 }));
  }, [params.q]);

  const handleStatusChange = useCallback(
    (value: string) => {
      const next = selectedStatus === value ? undefined : value;
      setSelectedStatus(next);
      setParams((prev) => ({ ...prev, category: next, page: 0 }));
    },
    [selectedStatus],
  );

  const handleSort = useCallback((column: string) => {
    setParams((prev) => ({
      ...prev,
      sort_by: column,
      sort_dir: prev.sort_by === column && prev.sort_dir === 'asc' ? 'desc' : 'asc',
      page: 0,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setParams((prev) => ({ ...prev, page_size: size, page: 0 }));
  }, []);

  const page = params.page ?? 0;
  const sort = {
    column: params.sort_by ?? 'name',
    direction: (params.sort_dir ?? 'asc') as 'asc' | 'desc',
  };
  const hasQuery = !!(params.q || params.category);
  const statusLabel = selectedStatus
    ? (STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label ?? selectedStatus)
    : 'Tous les statuts';

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

      <div className="mb-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <CertificateSearch
          value={params.q ?? ''}
          onChange={(v) => setParams((prev) => ({ ...prev, q: v || undefined, page: 0 }))}
          onSearch={handleSearch}
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-48 justify-between text-xs font-normal"
              >
                {statusLabel}
                <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-0.5">
                {STATUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    htmlFor={`status-${opt.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs"
                  >
                    <Checkbox
                      id={`status-${opt.value}`}
                      checked={selectedStatus === opt.value}
                      onCheckedChange={() => handleStatusChange(opt.value)}
                      className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {selectedStatus && (
                <button
                  type="button"
                  className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                  onClick={() => handleStatusChange(selectedStatus)}
                >
                  Effacer le filtre
                </button>
              )}
            </PopoverContent>
          </Popover>
          <Button
            onClick={() => {
              setEditingCert(undefined);
              setDrawerOpen(true);
            }}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
          >
            <Plus className="size-4" />
            Nouvelle attestation
          </Button>
        </div>
      </div>

      {selectedStatus && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className="h-6 gap-1 px-2 text-xs font-normal bg-(--color-primary) text-white"
          >
            {STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label ?? selectedStatus}
            <button
              type="button"
              onClick={() => handleStatusChange(selectedStatus)}
              className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
              aria-label="Retirer ce filtre"
            >
              <X className="size-3" />
            </button>
          </Badge>
        </div>
      )}

      <AdminCertificatesTable
        certificates={data?.data ?? []}
        isLoading={isLoading}
        hasQuery={hasQuery}
        page={page}
        pageSize={params.page_size ?? 25}
        total={data?.total ?? 0}
        sort={sort}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={(cert) => {
          setEditingCert(cert);
          setDrawerOpen(true);
        }}
        onDelete={(cert) => setDeletingItem(cert)}
        onPreview={setPreviewCert}
        tenantNames={tenantNames}
      />

      <AdminCertificateFormDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingCert(undefined);
        }}
        onSuccess={() => {
          setDrawerOpen(false);
          setEditingCert(undefined);
        }}
        certificate={editingCert}
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

      <ConfirmDialog
        open={deletingItem !== null}
        title="Supprimer l'attestation"
        description={
          deletingItem
            ? `Êtes-vous sûr de vouloir supprimer «${deletingItem.name}»? Cette action est irréversible.`
            : undefined
        }
        confirmLabel="Supprimer"
        confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) deleteMutation.mutate(deletingItem.id);
        }}
      />
    </div>
  );
}
