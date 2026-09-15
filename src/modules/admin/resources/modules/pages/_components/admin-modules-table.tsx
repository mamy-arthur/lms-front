'use client';

import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';
import { formatDate } from '@/shared/lib/date';
import { MODULE_LOCKED_LABEL, describeLockOrigins } from '@/shared/types/catalog-lock.types';
import type { Module } from '../../types';
import { ModuleActions } from './module-actions';

export type SortConfig = DataTableSort;

interface AdminModulesTableProps {
  modules: Module[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit?: (module: Module) => void;
  onDuplicate?: (module: Module) => void;
  onDelete?: (module: Module) => void;
}

export function AdminModulesTable({
  modules,
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
  onDuplicate,
  onDelete,
}: AdminModulesTableProps) {
  const columns: DataTableColumn<Module>[] = [
    {
      key: 'idnumber',
      label: 'Référence',
      sortable: true,
      render: (mod) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium">{mod.idnumber}</span>
        </div>
      ),
    },
    {
      key: 'shortname',
      label: 'Module',
      sortable: true,
      render: (mod) => (
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{mod.shortname}</span>
        </div>
      ),
    },
    {
      key: 'category_name',
      label: 'Catégorie',
      sortable: true,
      render: (mod) => (
        <span className="text-xs text-muted-foreground">{mod.category_name ?? '—'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Création',
      sortable: true,
      render: (mod) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {mod.createdAt ? formatDate(mod.createdAt) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (mod) => (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <ModuleActions
            moduleLabel={mod.shortname}
            onEdit={() => onEdit?.(mod)}
            onDuplicate={() => onDuplicate?.(mod)}
            onDelete={() => onDelete?.(mod)}
            locked={mod.isLocked}
            lockReason={`${MODULE_LOCKED_LABEL}. ${describeLockOrigins(mod.lockOrigins)}`}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={modules}
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
      onRowClick={onEdit}
      rowTestId="admin-module-row"
      emptyState={{
        title: 'Aucun module',
        description: 'Aucun module pour le moment.',
      }}
    />
  );
}
