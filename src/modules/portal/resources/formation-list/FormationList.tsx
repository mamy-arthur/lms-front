'use client';

import { useState, useMemo } from 'react';
import { LayoutGrid, List, ChevronDown, BookOpen, CheckCircle2, Clock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormationCard } from '@/modules/portal/resources/_shared/trainee/FormationCard';
import { MOCK_FORMATIONS } from '@/modules/portal/resources/_shared/trainee/mock-data';
import type { FormationStatus } from '@/modules/portal/resources/_shared/trainee/types';

type FilterTab = 'all' | FormationStatus;

const FILTER_TABS: { label: string; value: FilterTab; icon: React.ReactNode }[] = [
  { label: 'Toutes', value: 'all', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { label: 'En cours', value: 'in_progress', icon: <Clock className="h-3.5 w-3.5" /> },
  { label: 'Terminées', value: 'completed', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { label: 'À commencer', value: 'not_started', icon: <Play className="h-3.5 w-3.5" /> },
];

const KPI_ICONS = [
  { icon: BookOpen, bg: 'bg-orange-50', color: 'text-[var(--color-primary)]' },
  { icon: Clock, bg: 'bg-orange-50', color: 'text-[var(--color-primary)]' },
  { icon: CheckCircle2, bg: 'bg-green-50', color: 'text-green-600' },
  { icon: Play, bg: 'bg-purple-50', color: 'text-purple-600' },
];

export default function FormationListPage() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const total = MOCK_FORMATIONS.length;
  const inProgress = MOCK_FORMATIONS.filter((c) => c.status === 'in_progress').length;
  const completed = MOCK_FORMATIONS.filter((c) => c.status === 'completed').length;
  const notStarted = MOCK_FORMATIONS.filter((c) => c.status === 'not_started').length;

  const kpis = [
    { value: total, label: ['Formations', 'Inscrites'] },
    { value: inProgress, label: ['Formations', 'En Cours'] },
    { value: completed, label: ['Formations', 'Terminées'] },
    { value: notStarted, label: ['Formation', 'À commencer'] },
  ];

  const filtered = useMemo(() => {
    if (filter === 'all') return MOCK_FORMATIONS;
    return MOCK_FORMATIONS.filter((c) => c.status === filter);
  }, [filter]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mes formations</h1>
          <p className="mt-1 text-xs text-slate-500">
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
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kpis.map((kpi, i) => {
            const { icon: Icon, bg, color } = KPI_ICONS[i];
            return (
              <div
                key={kpi.label.join()}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    bg,
                  )}
                >
                  <Icon className={cn('h-5 w-5', color)} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800">{kpi.value}</p>
                  <p className="text-xs text-slate-400 leading-tight">
                    {kpi.label[0]}
                    <br />
                    {kpi.label[1]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 ? (
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

        <div className="flex items-center justify-center gap-2 py-2">
          <span className="text-sm text-slate-400">
            1-{filtered.length} sur {total} formations
          </span>
          <div className="flex items-center gap-1 ml-4">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40"
              disabled
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-semibold text-white shadow-sm"
            >
              1
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              2
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
