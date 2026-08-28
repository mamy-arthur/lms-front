'use client';

import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';
import { formatDate } from '@/shared/lib/date';
import type { Module } from '../../types';
import { useCompetencyCategoriesQuery } from '../../hooks/useCompetencyCategoriesQuery';
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
  const { data: categories = [] } = useCompetencyCategoriesQuery();
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const columns: DataTableColumn<Module>[] = [
    {
      key: 'identifier',
      label: 'Référence',
      sortable: true,
      render: (mod) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium">{mod.idnumber}</span>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Module',
      sortable: true,
      render: (mod) => (
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{mod.shortname}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Catégorie',
      sortable: true,
      render: (mod) => (
        <span className="text-xs text-muted-foreground">
          {mod.category_id ? (categoryNameById.get(mod.category_id) ?? '—') : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
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
