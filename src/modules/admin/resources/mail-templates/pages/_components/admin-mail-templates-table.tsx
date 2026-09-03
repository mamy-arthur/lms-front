'use client';

import { Mail, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MailTemplateActions } from '@modules/shared/components/mail-templates';
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';
import { formatDate } from '@/shared/lib/date';
import { useDuplicateMailTemplate } from '../../hooks/useDuplicateMailTemplate';
import type { MailTemplate } from '../../types';

export type SortConfig = DataTableSort;

interface AdminMailTemplatesTableProps {
  templates: MailTemplate[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (template: MailTemplate) => void;
  onDelete?: (template: MailTemplate) => void;
  onPreview: (template: MailTemplate) => void;
  tenantNames: Record<string, string>;
}

export function AdminMailTemplatesTable({
  templates,
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
}: AdminMailTemplatesTableProps) {
  const duplicateMutation = useDuplicateMailTemplate();
  const columns: DataTableColumn<MailTemplate>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      cellClassName: 'w-1/3',
      render: (tpl) => (
        <div className="text-wrap">
          <span className="text-xs font-medium text-foreground wrap-break-word">{tpl.name}</span>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Sujet',
      sortable: true,
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (tpl) => (
        <div className="text-wrap">
          <span className="text-xs text-muted-foreground wrap-break-word">{tpl.subject}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Statut',
      sortable: false,
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (tpl) =>
        tpl.isActive ? (
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
      key: 'updatedAt',
      label: 'Mis à jour',
      sortable: true,
      render: (tpl) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate(tpl.updatedAt)}
        </span>
      ),
    },
    {
      key: 'id',
      label: '',
      sortable: false,
      render: (tpl) => (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <MailTemplateActions
            templateLabel={tpl.name}
            onPreview={() => onPreview(tpl)}
            onEdit={() => onEdit(tpl)}
            onDuplicate={() => duplicateMutation.mutate(tpl.id)}
            onDelete={() => onDelete?.(tpl)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={templates}
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
        onRowClick={(tpl) => onPreview(tpl)}
        tableClassName="table-fixed"
        emptyState={{
          icon: <Mail className="size-8 text-muted-foreground" />,
          title: 'Aucun template mail',
          description: 'Créez votre premier template mail en cliquant sur « Nouveau template ».',
        }}
      />
    </>
  );
}
