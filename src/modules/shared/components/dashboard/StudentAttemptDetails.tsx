'use client';

import type { ReactNode } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  LockKeyhole,
  RotateCcw,
  SkipForward,
  CircleDashed,
  CirclePlay,
  Timer,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  formatAttemptDate,
  formatTrackedDuration,
} from '@/modules/shared/lib/studentProgressFormatters';
import type {
  AttemptNodeStatus,
  EnrollmentAttemptCourse,
  EnrollmentAttemptDetail,
  EnrollmentAttemptNode,
} from '@/shared/types/enrollment-history.types';

const successStyle =
  'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300';
const neutralStyle = 'border-border bg-muted text-muted-foreground';
const stepStyles: Record<AttemptNodeStatus, string> = {
  completed: successStyle,
  failed:
    'border-red-200 bg-red-200 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  in_progress:
    'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  locked: neutralStyle,
  carried_over: successStyle,
  available:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  to_redo:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  skipped: neutralStyle,
  not_reached: neutralStyle,
};

const statusLabels: Record<AttemptNodeStatus, string> = {
  completed: 'Terminé',
  failed: 'Échouée',
  in_progress: 'En cours',
  available: 'Disponible',
  carried_over: 'Acquis conservé',
  to_redo: 'À refaire',
  locked: 'Verrouillé',
  skipped: 'Ignoré',
  not_reached: 'Non atteint',
};

const statusIcons = {
  completed: Check,
  failed: X,
  in_progress: Clock3,
  available: CirclePlay,
  carried_over: Check,
  to_redo: RotateCcw,
  locked: LockKeyhole,
  skipped: SkipForward,
  not_reached: CircleDashed,
};

const courseLabels: Record<EnrollmentAttemptCourse['status'], string> = {
  completed: 'Terminé',
  in_progress: 'En cours',
  not_started: 'Non commencé',
  no_content: 'Sans contenu',
};

function canDisplayTime(status: AttemptNodeStatus | EnrollmentAttemptCourse['status']): boolean {
  return status === 'completed' || status === 'failed' || status === 'in_progress';
}

export function StudentAttemptDetails({ detail }: { detail: EnrollmentAttemptDetail }) {
  const { attempt } = detail;
  const nodes = [...detail.nodes].sort((a, b) => a.position - b.position);
  return (
    <div className="space-y-4 border-t px-4 pt-4">
      <p className="text-xs text-muted-foreground">
        Étapes enregistrées pour cette tentative, dans l’ordre du parcours. Ouvrez un module pour
        voir le temps passé par cours. Le temps passé, le score et le compteur de tentatives des
        évaluations terminées sont affichés directement.
      </p>
      {nodes.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Aucune étape disponible pour cette tentative.
        </p>
      )}
      <ol
        aria-label={`Étapes de la tentative ${attempt.attempt_number}`}
        className="mt-4 space-y-0"
      >
        {nodes.map((step, index) => {
          const StateIcon = statusIcons[step.display_status];

          return (
            <li
              key={`${attempt.id}-${step.type}-${step.key}`}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {index < nodes.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-8 bottom-0 left-4 border-l border-border"
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  'relative flex size-8 shrink-0 items-center justify-center rounded-full border',
                  stepStyles[step.display_status],
                )}
              >
                <StateIcon className="size-3.5" />
              </span>
              {step.type === 'module' ? (
                <ModuleStep step={step} attemptNumber={attempt.attempt_number} />
              ) : (
                <EvaluationStep step={step} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepHeading({ step, children }: { step: EnrollmentAttemptNode; children: ReactNode }) {
  const label =
    step.type === 'evaluation' && step.display_status === 'completed'
      ? 'Réussie'
      : statusLabels[step.display_status];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="min-w-0 text-sm font-medium">{children}</h4>
      <Badge variant="outline" className={stepStyles[step.display_status]}>
        {label}
      </Badge>
    </div>
  );
}

function EvaluationStep({ step }: { step: EnrollmentAttemptNode }) {
  const finished = step.display_status === 'completed' || step.display_status === 'failed';
  return (
    <div className="min-w-0 flex-1 space-y-2 pt-1">
      <StepHeading step={step}>
        <span className={cn('flex items-center gap-2', !finished && 'text-muted-foreground')}>
          <ClipboardCheck aria-hidden="true" className="size-3.5 shrink-0" />
          {step.title}
        </span>
      </StepHeading>
      {canDisplayTime(step.display_status) && (
        <div className="space-y-3 rounded-sm pl-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-1 tabular-nums">
              <Timer aria-hidden="true" className="size-3.5 shrink-0" />
              Temps passé :{' '}
              {step.elapsed_seconds !== null ? formatTrackedDuration(step.elapsed_seconds) : '—'}
            </p>
            {finished && (
              <>
                <p>Score : {step.score !== null ? `${step.score} %` : '—'}</p>
                <p>
                  Tentative : {step.attempts_used ?? '—'}/{step.max_attempts ?? '—'}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleStep({
  step,
  attemptNumber,
}: {
  step: EnrollmentAttemptNode;
  attemptNumber: number;
}) {
  const canExpand = step.display_status === 'completed';
  return (
    <Collapsible disabled={!canExpand} className="min-w-0 flex-1 space-y-2 pt-1">
      <StepHeading step={step}>
        <CollapsibleTrigger
          aria-label={`Voir le temps par cours de ${step.title}`}
          className="group flex items-center gap-2 rounded-sm text-left outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          <BookOpen aria-hidden="true" className="size-3.5 shrink-0" />
          {step.title}
          {canExpand && (
            <ChevronDown
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none"
            />
          )}
        </CollapsibleTrigger>
      </StepHeading>
      {step.started_at && (
        <p className="text-xs text-muted-foreground">
          Début : <time dateTime={step.started_at}>{formatAttemptDate(step.started_at)}</time>
        </p>
      )}
      {step.completed_at && (
        <p className="text-xs text-muted-foreground">
          Fin : <time dateTime={step.completed_at}>{formatAttemptDate(step.completed_at)}</time>
        </p>
      )}
      {canDisplayTime(step.display_status) && (
        <p className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
          <Timer aria-hidden="true" className="size-3.5 shrink-0" />
          Temps passé : {formatTrackedDuration(step.tracked_time_seconds)}
        </p>
      )}
      {canExpand && (
        <CollapsibleContent>
          <ModuleCourses step={step} attemptNumber={attemptNumber} />
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function ModuleCourses({
  step,
  attemptNumber,
}: {
  step: EnrollmentAttemptNode;
  attemptNumber: number;
}) {
  return (
    <div className="mt-3 space-y-3 rounded-sm border p-3">
      {step.courses.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucun détail par cours disponible pour ce module.
        </p>
      ) : (
        <ul
          aria-label={`Temps par cours de ${step.title} — tentative ${attemptNumber}`}
          className="divide-y divide-border"
        >
          {[...step.courses]
            .sort((a, b) => a.position - b.position)
            .map((course) => (
              <li
                key={course.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium">{course.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {courseLabels[course.status]} · {course.progress.completed} /{' '}
                    {course.progress.total} contenus terminés
                  </p>
                </div>
                {canDisplayTime(course.status) && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium tabular-nums">
                    <span className="sr-only">Temps passé : </span>
                    {formatTrackedDuration(course.tracked_time_seconds)}
                  </span>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
