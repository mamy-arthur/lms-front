import { BookOpen, Check, ChevronDown, ClipboardCheck, Clock3, LockKeyhole, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { formatAttemptDuration, type StudentAttemptDemo } from '../data/studentAttemptsDemo';

const stepStyles = {
  completed:
    'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  failed:
    'border-red-200 bg-red-200 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  in_progress:
    'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  locked: 'border-border bg-muted text-muted-foreground',
};

export function StudentAttemptDetails({ attempt }: { attempt: StudentAttemptDemo }) {
  return (
    <div className="space-y-4 border-t px-4 pt-4">
      <p className="text-xs text-muted-foreground">
        Étapes dans l’ordre du parcours. Une évaluation échouée bloque la suite de cette tentative.{' '}
        Ouvrez un module pour voir le temps passé par cours.
      </p>
      <ol aria-label={`Étapes de la tentative ${attempt.number}`} className="mt-4 space-y-0">
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
            <li key={`${attempt.id}-${step.id}`} className="relative flex gap-3 pb-5 last:pb-0">
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
              <Collapsible
                disabled={step.kind !== 'module' || step.state === 'locked'}
                className="min-w-0 flex-1 space-y-2 pt-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="min-w-0 text-sm font-medium">
                    {step.kind === 'module' ? (
                      <CollapsibleTrigger
                        aria-label={`Voir le temps par cours de ${step.title}`}
                        className="group flex items-center gap-2 rounded-sm text-left outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-muted-foreground"
                      >
                        <KindIcon aria-hidden="true" className="size-3.5 shrink-0" />
                        {step.title}
                        {step.state !== 'locked' && (
                          <ChevronDown
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none"
                          />
                        )}
                      </CollapsibleTrigger>
                    ) : (
                      <span className="flex items-center gap-2">
                        <KindIcon
                          aria-hidden="true"
                          className="size-3.5 shrink-0 text-muted-foreground"
                        />
                        {step.title}
                      </span>
                    )}
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
                {step.kind === 'module' && step.state !== 'locked' && (
                  <CollapsibleContent>
                    <div className="mt-3 space-y-3 rounded-sm border  p-3">
                      {step.courses.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Aucun détail par cours disponible pour ce module.
                        </p>
                      ) : (
                        <ul
                          aria-label={`Temps par cours de ${step.title} — tentative ${attempt.number}`}
                          className="divide-y divide-border"
                        >
                          {step.courses.map((course) => (
                            <li
                              key={course.id}
                              className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                            >
                              <div className="min-w-0 space-y-1">
                                <p className="text-xs font-medium">{course.title}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {course.state === 'completed'
                                    ? 'Terminé'
                                    : course.state === 'in_progress'
                                      ? 'En cours'
                                      : 'Non commencé'}
                                </p>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium tabular-nums">
                                <span className="sr-only">Temps passé : </span>
                                {formatAttemptDuration(course.minutes)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
