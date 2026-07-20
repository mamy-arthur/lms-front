'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, BookOpen, Award, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TraineeFormation } from '@/modules/portal/resources/_shared/trainee/types';

interface ContinueLearningListProps {
  formations: TraineeFormation[];
}

const STATUS_CONFIG = {
  in_progress: {
    label: 'En cours',
    icon: Clock,
    className: 'bg-orange-50 text-orange-600 border-orange-200',
    iconClass: 'text-orange-400',
  },
  completed: {
    label: 'Terminé',
    icon: CheckCircle2,
    className:
      'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)] border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]',
    iconClass: 'text-[var(--color-primary)]',
  },
  not_started: {
    label: 'Non commencé',
    icon: BookOpen,
    className: 'bg-slate-50 text-slate-500 border-slate-200',
    iconClass: 'text-slate-400',
  },
};

const LEVEL_LABELS: Record<string, string> = {
  'Développement Web': 'Avancé',
  Design: 'Intermédiaire',
  Sécurité: 'Intermédiaire',
  Management: 'Débutant',
  Data: 'Avancé',
  'Soft Skills': 'Débutant',
};

interface FormationRowProps {
  formation: TraineeFormation;
  onSelect: (formation: TraineeFormation) => void;
}

function FormationRow({ formation, onSelect }: FormationRowProps) {
  const status = STATUS_CONFIG[formation.status];
  const StatusIcon = status.icon;
  const level = LEVEL_LABELS[formation.category] ?? 'Tous niveaux';

  return (
    <div className="group grid grid-cols-[1fr] sm:grid-cols-[1fr_160px_140px_auto] items-center gap-4 rounded-xl px-6 py-3 transition-colors hover:bg-slate-50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <img
            src={formation.coverImage}
            alt={formation.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-[var(--color-primary)] transition-colors">
            {formation.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {level} · {formation.totalModules} modules
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              formation.status === 'completed'
                ? 'bg-[var(--color-primary)]'
                : 'bg-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]',
            )}
            style={{ width: `${formation.progress}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold text-slate-600 w-8 text-right">
          {formation.progress}%
        </span>
      </div>

      <div className="hidden sm:flex items-center">
        <Badge
          variant="outline"
          className={cn('flex items-center gap-1.5 text-xs font-medium', status.className)}
        >
          <StatusIcon className={cn('h-3 w-3', status.iconClass)} />
          {status.label}
        </Badge>
      </div>

      <div className="hidden sm:flex items-center justify-end">
        {formation.status === 'completed' ? (
          <button
            type="button"
            onClick={() => onSelect(formation)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            <Award className="h-3.5 w-3.5 text-amber-500" />
            Attestation
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelect(formation)}
            className="flex items-center gap-1.5 rounded-lg bg-(--color-primary) px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            <Play className="h-3 w-3 fill-white" />
            Continuer
          </button>
        )}
      </div>
    </div>
  );
}

export function ContinueLearningList({ formations }: ContinueLearningListProps) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-bold text-slate-800">Continuer l'apprentissage</h2>
        <button className="text-xs font-medium text-[var(--color-primary)] hover:underline">
          Voir tout
        </button>
      </div>

      <div className="hidden grid-cols-[1fr_160px_140px_auto] gap-4 px-6 py-2 sm:grid">
        <span className="pl-24 text-xs font-medium text-slate-400">Nom de la formation</span>
        <span className="text-xs font-medium text-slate-400">Progression</span>
        <span className="text-xs font-medium text-slate-400">Statut</span>
        <span />
      </div>

      <div className="divide-y divide-slate-50 px-2 pb-2">
        {formations.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Aucune formation en cours.</p>
        ) : (
          formations.map((formation) => (
            <FormationRow
              key={formation.id}
              formation={formation}
              onSelect={(f) =>
                f.status === 'completed'
                  ? router.push(`/certificates?formation=${f.slug}`)
                  : router.push(`/mes-formations/${f.slug}/learn`)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
