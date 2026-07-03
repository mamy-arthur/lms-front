'use client';

import { Eye, MoreHorizontal, Pencil, Plus, Search, Settings2, Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { formatDate } from '@/shared/lib/date';
import { StatusBadge } from './StatusBadge';

export type Formation = {
  id: number;
  name: string;
  category: string;
  status: 'Publié' | 'Brouillon' | 'Archivé';
  deadline?: string;
  cost?: number;
  currency?: string;
};

const formations: Formation[] = [
  {
    id: 1,
    name: 'React Avancé',
    category: 'Développement',
    status: 'Publié',
    deadline: '2026-09-30',
    cost: 299,
    currency: 'EUR',
  },
  {
    id: 2,
    name: 'Docker',
    category: 'DevOps',
    status: 'Brouillon',
    deadline: '2026-08-15',
    cost: 0,
    currency: 'EUR',
  },
  {
    id: 3,
    name: 'Scrum',
    category: 'Management',
    status: 'Archivé',
    cost: 149,
    currency: 'EUR',
  },
  {
    id: 4,
    name: 'Next.js',
    category: 'Développement',
    status: 'Publié',
    deadline: '2026-12-01',
    cost: 199,
    currency: 'USD',
  },
];

function ProgramsTableBase({ onNew }: { onNew?: () => void }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return formations;
    return formations.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const ActionMenu = useCallback(function ActionMenu({ item }: { item: Formation }) {
    return (
      <div className="text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
              aria-label={`Actions pour ${item.name}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem>
              <Eye className="mr-2 size-3.5 text-muted-foreground" />
              Consulter
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 size-3.5 text-muted-foreground" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 size-3.5" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }, []);

  const columns: DataTableColumn<Formation>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Nom',
        sortable: true,
        render: (row) => <span className="text-xs font-medium">{row.name}</span>,
      },
      {
        key: 'category',
        label: 'Catégorie',
        sortable: true,
        render: (row) => <span className="text-xs text-muted-foreground">{row.category}</span>,
      },
      {
        key: 'status',
        label: 'Statut',
        sortable: true,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'deadline',
        label: "Date d'échéance",
        sortable: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.deadline ? formatDate(row.deadline) : '—'}
          </span>
        ),
      },
      {
        key: 'cost',
        label: 'Tarification',
        sortable: true,
        render: (row) => {
          if (row.cost === undefined)
            return <span className="text-xs text-muted-foreground">—</span>;
          if (row.cost === 0)
            return <span className="text-xs font-medium text-emerald-600">Gratuit</span>;
          return (
            <span className="text-xs font-medium tabular-nums">
              {row.cost.toLocaleString('fr-FR')} {row.currency ?? 'EUR'}
            </span>
          );
        },
      },
      {
        key: 'actions',
        label: '',
        sortable: false,
        render: (row) => <ActionMenu item={row} />,
      },
    ],
    [ActionMenu],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une formation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button variant="outline">
            <Settings2 className="size-4" />
            Filtrer
          </Button>
          <Button
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
            onClick={onNew}
          >
            <Plus className="size-4" />
            Nouvelle formation
          </Button>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={false}
        hasQuery={!!search.trim()}
        page={1}
        pageSize={filtered.length || 1}
        total={filtered.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        emptyState={{
          title: 'Aucune formation',
          description: 'Aucune formation pour le moment.',
          filteredTitle: 'Aucun résultat',
          filteredDescription: 'Aucune formation ne correspond à votre recherche.',
        }}
      />
    </div>
  );
}

export const ProgramsTable = memo(ProgramsTableBase) as typeof ProgramsTableBase;
