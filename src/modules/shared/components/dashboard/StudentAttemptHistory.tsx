'use client';

import { useState } from 'react';
import { CalendarDays, CircleAlert, History, Timer } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardEnrollmentStatuses } from '@/modules/shared/lib/dashboardEnrollmentStatuses';
import {
  useEnrollmentAttemptDetailQuery,
  useEnrollmentHistoryQuery,
  useEnrollmentHistoryScope,
} from '@/modules/shared/hooks/useEnrollmentHistoryQuery';
import {
  formatAttemptDate,
  formatTrackedDuration,
} from '@/modules/shared/lib/studentProgressFormatters';
import { StudentAttemptDetails } from './StudentAttemptDetails';

export function StudentAttemptHistory({ enrollmentId }: { enrollmentId: string }) {
  const scope = useEnrollmentHistoryScope();
  return (
    <EnrollmentHistoryContent
      key={JSON.stringify([...scope.key, enrollmentId])}
      enrollmentId={enrollmentId}
    />
  );
}

function AttemptDetail({ enrollmentId, attemptId }: { enrollmentId: string; attemptId: string }) {
  // This component is mounted only while its accordion is expanded.
  const query = useEnrollmentAttemptDetailQuery(enrollmentId, attemptId, true);
  if (!query.enabled) return null;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-2 px-4 pt-4">
        <p>Impossible de charger les étapes de cette tentative.</p>
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
          Réessayer les étapes
        </Button>
      </div>
    );
  }
  if (!query.data) {
    return (
      <p role="status" className="px-4 pt-4">
        Chargement des étapes…
      </p>
    );
  }
  return <StudentAttemptDetails detail={query.data} />;
}

function EnrollmentHistoryContent({ enrollmentId }: { enrollmentId: string }) {
  const [page, setPage] = useState(1);
  // null keeps the automatic selection; '' preserves an explicit user collapse.
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);
  const query = useEnrollmentHistoryQuery(enrollmentId, page);

  if (!query.enabled) {
    return <p className="text-sm text-muted-foreground">Historique indisponible.</p>;
  }

  const changePage = (nextPage: number) => {
    setSelectedAttempt(null);
    setPage(nextPage);
  };

  const pagination = (
    <nav aria-label="Pagination des tentatives" className="flex items-center justify-between gap-3">
      <Button variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>
        Tentatives précédentes
      </Button>
      <span className="text-xs" aria-live="polite">
        Page {query.data?.meta.page ?? page}
        {query.data &&
          ` sur ${Math.max(1, Math.ceil(query.data.meta.total / query.data.meta.per_page))}`}
      </span>
      <Button
        variant="outline"
        disabled={
          !query.data || query.data.meta.page * query.data.meta.per_page >= query.data.meta.total
        }
        onClick={() => changePage(page + 1)}
      >
        Tentatives suivantes
      </Button>
    </nav>
  );

  if (query.isError) {
    return (
      <div className="space-y-3">
        <div role="alert" className="space-y-2">
          <p>Impossible de charger l’historique des tentatives.</p>
          <Button
            variant="outline"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            Réessayer l’historique
          </Button>
        </div>
        {page > 1 && pagination}
      </div>
    );
  }

  if (!query.data) return <p role="status">Chargement de l’historique des tentatives…</p>;

  const { attempts } = query.data.data;
  const { meta } = query.data;
  // The API also uses in_progress for the current attempt before its first start.
  const expandedAttempt =
    selectedAttempt ?? attempts.find((attempt) => attempt.status === 'in_progress')?.id ?? '';

  if (attempts.length === 0) {
    return (
      <div className="space-y-2 rounded-sm border border-dashed p-6 text-center">
        <History aria-hidden="true" className="mx-auto size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Aucune tentative à afficher.</p>
        {page > 1 && pagination}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs">
        {meta.total} tentative{meta.total > 1 ? 's' : ''} · Ouvrez une tentative pour consulter ses
        étapes.
      </p>
      <Accordion
        type="single"
        collapsible
        value={expandedAttempt}
        onValueChange={setSelectedAttempt}
        className="gap-3 overflow-visible rounded-none border-0"
      >
        {attempts.map((attempt) => {
          const status = dashboardEnrollmentStatuses.find((item) => item.key === attempt.status);
          const showTrackedTime =
            attempt.status === 'completed' ||
            attempt.status === 'failed' ||
            (attempt.status === 'in_progress' && attempt.started_at !== null);
          const outcomeLabel =
            attempt.status === 'completed'
              ? 'Réussie'
              : attempt.status === 'failed'
                ? 'Échouée'
                : attempt.started_at
                  ? 'En cours'
                  : 'Non commencée';

          return (
            <AccordionItem
              key={attempt.id}
              value={attempt.id}
              className="overflow-hidden rounded-sm border data-open:bg-card"
            >
              <AccordionTrigger className="items-center gap-3 rounded-sm p-4 hover:no-underline focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">
                      Tentative {attempt.attempt_number}
                    </span>
                    <Badge variant="outline" className={status?.badgeClassName}>
                      {outcomeLabel}
                    </Badge>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs font-normal text-muted-foreground">
                    <CalendarDays aria-hidden="true" className="size-3.5" />
                    {attempt.started_at ? (
                      <span>
                        Début :{' '}
                        <time dateTime={attempt.started_at}>
                          {formatAttemptDate(attempt.started_at)}
                        </time>
                      </span>
                    ) : (
                      <span>Début : non commencée</span>
                    )}
                    {attempt.ended_at && (
                      <span>
                        · Fin :{' '}
                        <time dateTime={attempt.ended_at}>
                          {formatAttemptDate(attempt.ended_at)}
                        </time>
                      </span>
                    )}
                    {showTrackedTime && (
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <Timer aria-hidden="true" className="size-3.5" />
                        Temps passé : {formatTrackedDuration(attempt.time_spent_seconds)}
                      </span>
                    )}
                  </span>
                </span>
              </AccordionTrigger>
              {attempt.interruption_reason && (
                <div className="space-y-2 px-4 pb-4">
                  <Alert
                    variant="destructive"
                    className="rounded-sm border-destructive/20 bg-destructive/5"
                    aria-label={`Motif d’interruption · Tentative ${attempt.attempt_number}`}
                  >
                    <CircleAlert aria-hidden="true" />
                    <AlertTitle>Motif d’interruption</AlertTitle>
                    <AlertDescription>{attempt.interruption_reason.message}</AlertDescription>
                  </Alert>
                </div>
              )}
              <AccordionContent className="h-auto pb-4 [&_p:not(:last-child)]:mb-0">
                {expandedAttempt === attempt.id && (
                  <AttemptDetail enrollmentId={enrollmentId} attemptId={attempt.id} />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      {(meta.total > meta.per_page || page > 1) && pagination}
    </div>
  );
}
