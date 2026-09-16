import { BookOpen, Check, ClipboardCheck, Clock3, LockKeyhole, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatAttemptDuration, type StudentAttemptDemo } from '../data/studentAttemptsDemo';

const stepStyles = {
  completed:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  failed:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  in_progress:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  locked: 'border-border bg-muted text-muted-foreground',
};

export function StudentAttemptDetails({ attempt }: { attempt: StudentAttemptDemo }) {
  return (
    <div className="space-y-4 border-t px-4 pt-4">
      <p className="text-xs text-muted-foreground">
        Étapes dans l’ordre du parcours. Une évaluation échouée bloque la suite de cette tentative.
      </p>
      <ol aria-label={`Étapes de la tentative ${attempt.number}`} className="space-y-0">
        {attempt.steps.map((step, index) => {
          const label =
            step.state === 'completed'
              ? step.kind === 'evaluation'
                ? 'Réussie'
                : 'Terminé'
              : step.state === 'failed'
                ? 'Échouée'
                : step.state === 'in_progress'
                  ? 'En cours'
                  : step.kind === 'evaluation'
                    ? 'Verrouillée'
                    : 'Verrouillé';
          const StateIcon =
            step.state === 'completed'
              ? Check
              : step.state === 'failed'
                ? X
                : step.state === 'in_progress'
                  ? Clock3
                  : LockKeyhole;
          const KindIcon = step.kind === 'module' ? BookOpen : ClipboardCheck;

          return (
            <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
              {index < attempt.steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-8 bottom-0 left-4 border-l border-border"
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  'relative flex size-8 shrink-0 items-center justify-center rounded-full border',
                  stepStyles[step.state],
                )}
              >
                <StateIcon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="flex items-center gap-2 text-sm font-medium">
                    <KindIcon
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-muted-foreground"
                    />
                    {step.title}
                  </h4>
                  <Badge variant="outline" className={stepStyles[step.state]}>
                    {label}
                  </Badge>
                </div>
                {step.state === 'locked' ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">{step.reason}</p>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 aria-hidden="true" className="size-3" />
                    Temps passé : {formatAttemptDuration(step.minutes)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
