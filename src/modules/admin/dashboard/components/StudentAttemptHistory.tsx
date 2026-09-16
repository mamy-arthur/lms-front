import { CalendarDays, History, RotateCcw } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { formatAttemptDate, type StudentAttemptDemo } from '../data/studentAttemptsDemo';
import { enrollmentStatuses } from '../data/studentProgressDemo';
import { StudentAttemptDetails } from './StudentAttemptDetails';

export function StudentAttemptHistory({ attempts }: { attempts: StudentAttemptDemo[] }) {
  if (attempts.length === 0) {
    return (
      <div className="space-y-2 rounded-sm border border-dashed p-6 text-center">
        <History aria-hidden="true" className="mx-auto size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Aucune tentative commencée</p>
        <p className="text-xs text-muted-foreground">
          Cet étudiant n’a pas encore démarré ce parcours.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {attempts.length} tentative{attempts.length > 1 ? 's' : ''} · De la plus ancienne à la plus
        récente. Ouvrez une tentative pour consulter ses étapes.
      </p>
      <Accordion type="single" collapsible className="gap-3 overflow-visible rounded-none border-0">
        {attempts.map((attempt) => {
          const status = enrollmentStatuses.find((item) => item.key === attempt.outcome)!;
          const outcomeLabel =
            attempt.outcome === 'completed'
              ? 'Réussie'
              : attempt.outcome === 'failed'
                ? 'Échouée'
                : 'En cours';

          return (
            <AccordionItem
              key={attempt.id}
              value={attempt.id}
              className="overflow-hidden rounded-sm border data-open:bg-card"
            >
              <AccordionTrigger className="items-center gap-3 rounded-sm p-4 hover:no-underline focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">Tentative {attempt.number}</span>
                    <Badge variant="outline" className={status.badgeClassName}>
                      {outcomeLabel}
                    </Badge>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs font-normal text-muted-foreground">
                    <CalendarDays aria-hidden="true" className="size-3.5" />
                    Début :{' '}
                    <time dateTime={attempt.startedAt}>{formatAttemptDate(attempt.startedAt)}</time>
                    {attempt.endedAt && (
                      <span>
                        · Fin :{' '}
                        <time dateTime={attempt.endedAt}>{formatAttemptDate(attempt.endedAt)}</time>
                      </span>
                    )}
                  </span>
                  {attempt.restartReason && (
                    <span className="flex items-start gap-1.5 text-xs font-normal text-muted-foreground">
                      <RotateCcw aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                      {attempt.restartReason}
                    </span>
                  )}
                  {attempt.interruptionReason && (
                    <span className="block text-xs font-normal text-red-700 dark:text-red-300">
                      Motif d’interruption : {attempt.interruptionReason}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="h-auto pb-4 [&_p:not(:last-child)]:mb-0">
                <StudentAttemptDetails attempt={attempt} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
