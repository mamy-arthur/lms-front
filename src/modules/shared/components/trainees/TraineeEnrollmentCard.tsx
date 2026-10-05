'use client';

import { BookOpen, CalendarDays, Clock, Layers } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { EnrollmentStatus } from '@/shared/types/enrollment.types';
import type { TraineeEnrollment } from '@/shared/types/trainee-detail.types';
import { formatTrackedDuration, formatShortDate } from '../../lib/studentProgressFormatters';

// Palette alignée sur EnrollmentStatusBadge (dashboard portail)
export const TRAINEE_STATUSES: Record<EnrollmentStatus, { label: string; className: string }> = {
  in_progress: {
    label: 'En cours',
    className:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
  },
  completed: {
    label: 'Terminée',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  },
  not_started: {
    label: 'Non commencée',
    className:
      'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
  failed: {
    label: 'Échouée',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  },
  expired: {
    label: 'Expirée',
    className:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
  },
};

// Le backend peut faire évoluer les statuts : ne jamais laisser un statut inconnu casser le rendu.
const UNKNOWN_STATUS = {
  label: 'Statut inconnu',
  className:
    'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300',
};

export function TraineeDate({ value, empty = '—' }: { value: string | null; empty?: string }) {
  if (!value || Number.isNaN(new Date(value).getTime())) return <>{empty}</>;
  return <time dateTime={value}>{formatShortDate(value)}</time>;
}

export function TraineeEnrollmentCard({ enrollment }: { enrollment: TraineeEnrollment }) {
  const formation = enrollment.learning_path;
  const title = formation?.name || 'Formation indisponible';
  const status = TRAINEE_STATUSES[enrollment.status] ?? UNKNOWN_STATUS;
  const progress = enrollment.progress_percent;
  const hasProgress = Number.isFinite(progress) && progress >= 0 && progress <= 100;
  const completed = enrollment.completed_modules;
  const total = enrollment.total_modules;
  const moduleCounts =
    typeof completed === 'number' &&
    typeof total === 'number' &&
    Number.isInteger(completed) &&
    Number.isInteger(total) &&
    completed >= 0 &&
    total >= completed
      ? `${completed} / ${total}`
      : '—';
  const tracked = enrollment.time_spent_seconds;
  const trackedDuration =
    typeof tracked === 'number' && Number.isInteger(tracked) && tracked >= 0
      ? formatTrackedDuration(tracked)
      : '—';
  const dates = [
    { label: 'Inscription', value: enrollment.enrolled_at, empty: '—' },
    { label: 'Début', value: enrollment.started_at, empty: 'Non démarré' },
    {
      label: 'Fin',
      value: enrollment.status === 'failed' ? enrollment.failed_at : enrollment.completed_at,
      empty: '—',
    },
    { label: 'Expiré le', value: enrollment.expires_at, empty: 'Sans échéance' },
  ];

  return (
    <li className="@container/card rounded-xl border bg-background p-4 sm:p-5">
      <article aria-label={title} className="flex flex-col gap-5 @lg/card:flex-row">
        <Avatar className="size-20 shrink-0 rounded-xs after:rounded-sm sm:size-24">
          <AvatarImage src={formation?.image?.url} alt="" className="rounded-xs object-cover" />
          <AvatarFallback className="rounded-xs bg-muted text-[var(--trainee-accent)]">
            <BookOpen className="size-8" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="font-semibold break-words">{title}</h3>
            {formation?.description && (
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {formation.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            {hasProgress ? (
              <>
                <span className="text-xs font-semibold tabular-nums">{progress}%</span>
                <Progress
                  value={progress}
                  aria-label={`Progression de ${title}`}
                  className="h-1 max-w-48 [&_[data-slot=progress-indicator]]:bg-[var(--trainee-accent)]"
                />
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Progression indisponible</span>
            )}
          </div>
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {dates.map(({ label, value, empty }) => (
              <div key={label} className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                <dt>{label} :</dt>
                <dd>
                  <TraineeDate value={value} empty={empty} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <dl className="flex shrink-0 flex-col gap-3 border-t pt-4 text-xs text-muted-foreground @lg/card:justify-center @lg/card:border-t-0 @lg/card:border-l @lg/card:pt-0 @lg/card:pl-5">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Layers className="size-4 shrink-0" aria-hidden="true" />
            <dt>Modules terminés</dt>
            <dd className="font-medium text-foreground tabular-nums">{moduleCounts}</dd>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            <dt>Temps passé</dt>
            <dd className="font-medium text-foreground tabular-nums">{trackedDuration}</dd>
          </div>
        </dl>
      </article>
    </li>
  );
}
