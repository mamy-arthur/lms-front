'use client';

import { Award, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CertificateActions } from '@modules/shared/components/certificates';
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';
import { useDuplicatePortalCertificate } from '../../hooks/useDuplicatePortalCertificate';
import type { Certificate } from '../../types';

export type SortConfig = DataTableSort;

interface PortalCertificatesTableProps {
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
  onPreview: (certificate: Certificate) => void;
}

export function PortalCertificatesTable({
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
  onPreview,
}: PortalCertificatesTableProps) {
  const duplicateMutation = useDuplicatePortalCertificate();
  const columns: DataTableColumn<Certificate>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      cellClassName: 'w-1/3',
      render: (cert) => (
        <div className="text-wrap">
          <span className="text-xs font-medium text-foreground wrap-break-word">{cert.name}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Statut',
      sortable: false,
      headerClassName: 'text-center',
      cellClassName: 'text-center',
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
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (cert) =>
        cert.isDefaultTemplate ? (
          <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700">
            <CheckCircle2 className="size-3" />
            Oui
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground ">Non</span>
        ),
    },
    {
      key: 'id',
      label: '',
      sortable: false,
      render: (cert) => (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <CertificateActions
            certificateLabel={cert.name}
            onPreview={() => onPreview(cert)}
            onEdit={() => onEdit(cert)}
            onDuplicate={() => duplicateMutation.mutate(cert.id)}
            onDelete={() => onDelete?.(cert)}
          />
        </div>
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
        onRowClick={(cert) => onPreview(cert)}
        tableClassName="table-fixed"
        emptyState={{
          icon: <Award className="size-8 text-muted-foreground" />,
          title: 'Aucune attestation',
          description: "Vous n'avez pas encore d'attestation disponible.",
        }}
      />
    </>
  );
}
