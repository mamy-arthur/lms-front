import { CalendarDays, CircleAlert, History, RotateCcw } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
                </span>
              </AccordionTrigger>
              {(attempt.restartReason || attempt.interruptionReason) && (
                <div className="space-y-2 px-4 pb-4">
                  {attempt.restartReason && (
                    <Alert
                      className="rounded-sm bg-muted/40"
                      aria-label={`Reprise du parcours · Tentative ${attempt.number}`}
                    >
                      <RotateCcw aria-hidden="true" />
                      <AlertTitle>Reprise du parcours</AlertTitle>
                      <AlertDescription>{attempt.restartReason}</AlertDescription>
                    </Alert>
                  )}
                  {attempt.interruptionReason && (
                    <Alert
                      variant="destructive"
                      className="rounded-sm border-destructive/20 bg-destructive/5"
                      aria-label={`Motif d’interruption · Tentative ${attempt.number}`}
                    >
                      <CircleAlert aria-hidden="true" />
                      <AlertTitle>Motif d’interruption</AlertTitle>
                      <AlertDescription>{attempt.interruptionReason}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
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
