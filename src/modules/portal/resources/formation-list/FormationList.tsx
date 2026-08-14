'use client';

import { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  ChevronDown,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormationCard } from '@/modules/portal/resources/_shared/trainee/FormationCard';
import { useMyEnrollmentsQuery } from './hooks/useMyEnrollmentsQuery';
import { Skeleton } from '@/components/ui/skeleton';
import type { FormationStatus } from '@/modules/portal/resources/_shared/trainee/types';

type FilterTab = 'all' | FormationStatus;

const FILTER_TABS: { label: string; value: FilterTab; icon: React.ReactNode }[] = [
  { label: 'Toutes', value: 'all', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { label: 'En cours', value: 'in_progress', icon: <Clock className="h-3.5 w-3.5" /> },
  { label: 'Terminées', value: 'completed', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { label: 'À commencer', value: 'not_started', icon: <Play className="h-3.5 w-3.5" /> },
];

export default function FormationListPage() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');

  const { data: formations = [], isLoading } = useMyEnrollmentsQuery();

  const filtered = useMemo(() => {
    let result = filter === 'all' ? formations : formations.filter((c) => c.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
    return result;
  }, [filter, search, formations]);

  return (
    <div className="bg-background">
      <div className="mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mes formations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Retrouvez toutes vos formations, leur progression et vos attestations.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                  filter === tab.value
                    ? 'bg-(--color-primary) text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Catégorie <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Statut <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-44 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Trier par : Plus récent <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-400 hover:text-slate-600',
                )}
                aria-label="Vue grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list'
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-400 hover:text-slate-600',
                )}
                aria-label="Vue liste"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-20">
            <BookOpen className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">Aucune formation trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((formation) => (
              <FormationCard key={formation.id} formation={formation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
