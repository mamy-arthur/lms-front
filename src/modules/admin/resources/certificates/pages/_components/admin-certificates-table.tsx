'use client';

import { Award, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  CertificateActions,
  CertificatePreviewDialog,
} from '@modules/shared/components/certificates';
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';
import { formatDate } from '@/shared/lib/date';
import { useDuplicateCertificate } from '../../hooks/useDuplicateCertificate';
import type { Certificate } from '../../types';

export type SortConfig = DataTableSort;

interface AdminCertificatesTableProps {
  certificates: Certificate[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (certificate: Certificate) => void;
  onDelete?: (certificate: Certificate) => void;
  tenantNames: Record<string, string>;
}

export function AdminCertificatesTable({
  certificates,
  isLoading = false,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  tenantNames,
}: AdminCertificatesTableProps) {
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const duplicateMutation = useDuplicateCertificate();
  const columns: DataTableColumn<Certificate>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      render: (cert) => <span className="text-xs font-medium text-foreground">{cert.name}</span>,
    },
    {
      key: 'isActive',
      label: 'Statut',
      sortable: false,
      render: (cert) =>
        cert.isActive ? (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            <CheckCircle2 className="size-3" />
            Actif
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 border-rose-200 bg-rose-50 text-rose-700">
            <XCircle className="size-3" />
            Inactif
          </Badge>
        ),
    },
    {
      key: 'isDefaultTemplate',
      label: 'Modèle par défaut',
      sortable: false,
      render: (cert) =>
        cert.isDefaultTemplate ? (
          <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700">
            <CheckCircle2 className="size-3" />
            Oui
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Non</span>
        ),
    },
    {
      key: 'tenantId',
      label: 'Tenant',
      sortable: true,
      render: (cert) => (
        <span className="text-xs text-muted-foreground">
          {tenantNames[cert.tenantId] || cert.tenantId || '—'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Mis à jour',
      sortable: true,
      render: (cert) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate(cert.updatedAt)}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      render: (cert) => (
        <CertificateActions
          certificateLabel={cert.name}
          onPreview={() => setPreviewCert(cert)}
          onEdit={() => onEdit(cert)}
          onDuplicate={() => duplicateMutation.mutate(cert.id)}
          onDelete={() => onDelete?.(cert)}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={certificates}
        columns={columns}
        isLoading={isLoading}
        hasQuery={hasQuery}
        page={page}
        pageSize={pageSize}
        total={total}
        sort={sort}
        onSort={onSort}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyState={{
          icon: <Award className="size-8 text-muted-foreground" />,
          title: 'Aucune attestation',
          description:
            'Créez votre première attestation en cliquant sur \u00ab Nouvelle attestation \u00bb.',
        }}
      />

      {previewCert && (
        <CertificatePreviewDialog
          open={!!previewCert}
          onClose={() => setPreviewCert(null)}
          name={previewCert.name}
          body={previewCert.body}
        />
      )}
    </>
  );
}
