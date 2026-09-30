'use client';

import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { getDefaultActiveId, resolveActive } from './lib/course-utils';
import { buildExecutionContext, findNodeExecutionState } from './lib/execution-context';
import { EXECUTION_CONFLICT_MESSAGE } from './lib/constants';
import type { Formation } from './lib/types';
import type { RegisterScormSession, ScormSession } from './lib/scormRuntime';
import type { RegisterVideoSession, VideoProgressSession } from './lib/videoProgressSession';
import { useFormationSummaryQuery } from './hooks/useFormationSummaryQuery';
import { usePortalContentEntryQuery } from './hooks/usePortalContentEntryQuery';
import { useMarkContentCompleteMutation } from './hooks/useMarkContentCompleteMutation';
import { useContentTimeTracker } from './hooks/useContentTimeTracker';
import { useStartPendingExecution } from './hooks/useStartPendingExecution';
import { useExecutionConflictRecovery } from './hooks/useExecutionConflictRecovery';
import { portalLearningPathKeys } from '@/shared/queries/keys';
import FormationSidebar from './components/FormationSidebar';
import FormationContentView from './components/FormationContentView';
import FormationMobileSidebar from './components/FormationMobileSidebar';
import ExecutionStatusBanner from './components/ExecutionStatusBanner';
import EvaluationFailureDialog from './components/EvaluationFailureDialog';

interface Props {
  /** Enrollment UUID — le parcours affiché est toujours celui de son snapshot. */
  enrollmentId: string;
}

export default function FormationPlayer({ enrollmentId }: Props) {
  const queryClient = useQueryClient();
  const summaryQuery = useFormationSummaryQuery(enrollmentId);

  const formation = summaryQuery.data ?? null;

  const [activeId, setActiveId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  /** Échec en attente d'acquittement ; la redirection suit la confirmation. */
  const [failure, setFailure] = useState<{
    score: number;
    passingScore: number;
    remainingAttempts: number | null;
  } | null>(null);

  // Initialise activeId once the formation is available.
  const effectiveActiveId = activeId || (formation ? getDefaultActiveId(formation) : '');

  const resolved = formation ? resolveActive(formation, effectiveActiveId) : null;

  const activeCourseId = resolved?.kind === 'content' ? resolved.content.courseId : null;
  const activeEntryId = resolved?.kind === 'content' ? (resolved.content.entryId ?? null) : null;

  const entryQuery = usePortalContentEntryQuery(enrollmentId, activeCourseId, activeEntryId);

  const { mutateAsync: markComplete, isPending: isSaving } =
    useMarkContentCompleteMutation(enrollmentId);
  const [isFlushingTime, setIsFlushingTime] = useState(false);
  const completingRef = useRef(false);
  const videoSessionsRef = useRef(new Set<VideoProgressSession>());
  const registerVideoSession = useCallback<RegisterVideoSession>((session) => {
    videoSessionsRef.current.add(session);
    return () => {
      videoSessionsRef.current.delete(session);
    };
  }, []);
  const scormSessionRef = useRef<ScormSession | null>(null);
  const registerScormSession = useCallback<RegisterScormSession>((session) => {
    scormSessionRef.current = session;
    // A launch may resolve while completion is already flushing the time session.
    // The freshly constructed runtime has no dirty data yet, so freeze it now.
    if (completingRef.current) void session.prepareCompletion();
    return () => {
      if (scormSessionRef.current === session) scormSessionRef.current = null;
    };
  }, []);
  const isCompleting = isSaving || isFlushingTime;

  const recoverFromConflict = useExecutionConflictRecovery(enrollmentId);

  // Les sauvegardes automatiques SCORM et vidéo rechargent l'état serveur
  // sans alarmer l'apprenant ni rejouer une mutation d'une visite périmée.
  function handleExecutionConflict(err: unknown) {
    recoverFromConflict(err);
  }

  // Le moteur désigne lui-même la visite à ouvrir : on la démarre au lieu de
  // déduire une étape côté client.
  useStartPendingExecution(enrollmentId, formation);

  // `resolveActive` remonte déjà le nœud portant l'élément actif : module pour un
  // contenu, évaluation sinon.
  const activeNodeId = resolved?.node.id ?? null;
  const activeNodeExecution = findNodeExecutionState(formation, activeNodeId);
  const executionContext = buildExecutionContext(formation, activeNodeId);

  // Une visite actionable peut encore attendre /start : aucune mutation de
  // contenu ni période de temps avant que le serveur la confirme in_progress.
  const canMutate =
    !!formation &&
    !formation.execution.terminal &&
    (activeNodeExecution?.actionable ?? false) &&
    activeNodeExecution?.currentVisit?.status === 'in_progress' &&
    executionContext !== null;

  // Historical reads never create a time session. Completion explicitly flushes
  // the active period before closing the visit, not after the summary refresh.
  const trackedEntryId =
    canMutate && resolved?.kind === 'content' && !resolved.content.completed ? activeEntryId : null;

  // `resolveActive` remonte déjà le module portant le contenu : aucune plomberie
  // supplémentaire n'est nécessaire pour l'obtenir.
  const activeCompetencyId = resolved?.kind === 'content' ? resolved.node.id : null;

  // Le SCORM s'affiche dans une iframe : nos écouteurs d'activité ne voient pas
  // ce qui s'y passe, donc la détection d'inactivité y ferait des faux positifs.
  // Pour ces contenus, seule la visibilité de l'onglet pilote le chrono.
  const { flushBeforeComplete, resumeAfterFailure } = useContentTimeTracker({
    enrollmentId,
    courseId: activeCourseId,
    entryId: trackedEntryId,
    competencyId: activeCompetencyId,
    context: executionContext,
    idleDetection: entryQuery.data?.module_type !== 'scorm',
    onExecutionConflict: recoverFromConflict,
  });

  async function handleMarkComplete() {
    if (
      !activeCourseId ||
      !activeEntryId ||
      !executionContext ||
      entryQuery.isLoading ||
      !entryQuery.data ||
      completingRef.current ||
      isCompleting ||
      !canMutate ||
      resolved?.kind !== 'content' ||
      resolved.content.completed
    ) {
      return;
    }
    completingRef.current = true;
    setIsFlushingTime(true);
    // The content must be mounted before taking this snapshot: otherwise its
    // video sessions could register during the time flush, after this barrier.
    // Bookmark failures never change the existing manual completion policy.
    // Flush before closing the visit, while writes are still authorized.
    await Promise.allSettled(
      [...videoSessionsRef.current].map((session) => session.prepareCompletion()),
    );
    try {
      await scormSessionRef.current?.prepareCompletion();
    } catch (err) {
      videoSessionsRef.current.forEach((session) => session.resumeAfterFailure());
      scormSessionRef.current?.resumeAfterFailure();
      completingRef.current = false;
      setIsFlushingTime(false);
      if (recoverFromConflict(err)) toast.error(EXECUTION_CONFLICT_MESSAGE);
      else toast.error('Impossible de sauvegarder le contenu SCORM. Veuillez réessayer.');
      return;
    }
    try {
      await flushBeforeComplete();
    } catch (err) {
      videoSessionsRef.current.forEach((session) => session.resumeAfterFailure());
      scormSessionRef.current?.resumeAfterFailure();
      resumeAfterFailure();
      completingRef.current = false;
      setIsFlushingTime(false);
      if (recoverFromConflict(err)) toast.error(EXECUTION_CONFLICT_MESSAGE);
      else toast.error('Impossible de sauvegarder le temps de consultation. Veuillez réessayer.');
      return;
    }

    try {
      await markComplete({
        competencyId: resolved.node.id,
        courseId: activeCourseId,
        entryId: activeEntryId,
        context: executionContext,
      });
      // Le moteur a pu déplacer la visite ailleurs que sur l'étape suivante du
      // sommaire : on suit sa désignation plutôt que l'ordre d'affichage.
      const refreshed = queryClient.getQueryData<Formation>(
        portalLearningPathKeys.summary(enrollmentId),
      );
      if (refreshed) setActiveId(getDefaultActiveId(refreshed));
    } catch {
      // The mutation hook reports the error; keep measuring the unfinished content.
      videoSessionsRef.current.forEach((session) => session.resumeAfterFailure());
      scormSessionRef.current?.resumeAfterFailure();
      resumeAfterFailure();
    } finally {
      completingRef.current = false;
      setIsFlushingTime(false);
    }
  }

  function handleSelect(id: string) {
    if (isCompleting) return;
    handleNavigate(id);
    setSidebarOpen(false);
  }

  function handleNavigate(id: string | null) {
    // A completion callback holds the previous render's formation. Consult the
    // refreshed cache so it can only navigate to a genuinely unlocked successor.
    const currentFormation = queryClient.getQueryData<Formation>(
      portalLearningPathKeys.summary(enrollmentId),
    );
    if (id && currentFormation && resolveActive(currentFormation, id)) setActiveId(id);
  }

  async function handleEvaluationComplete(score: number, passed: boolean) {
    if (resolved?.kind !== 'evaluation') return;
    const evaluation = resolved.node;
    // Garder le score et le seuil de l'évaluation soumise, même si le moteur
    // déplace ensuite la visite sur un autre nœud.
    const outcome = {
      score: Math.round(score),
      passingScore: evaluation.passingScore,
    };
    // Épingler l'évaluation : sans cela, le nœud redevenu actionable prendrait la
    // main dès l'actualisation et l'écran de résultat disparaîtrait aussitôt.
    setActiveId(evaluation.id);

    // On attend l'état actualisé : la cible du rebouclage est décidée par le
    // moteur, et la lire avant le rafraîchissement désignerait l'ancienne étape.
    await queryClient.invalidateQueries({ queryKey: portalLearningPathKeys.summary(enrollmentId) });
    if (!passed) {
      const refreshed = queryClient.getQueryData<Formation>(
        portalLearningPathKeys.summary(enrollmentId),
      );
      // Relire le budget de l'évaluation soumise, pas celui de la cible de reprise.
      const failedEvaluation = refreshed?.nodes.find((node) => node.id === evaluation.id);
      setFailure({
        ...outcome,
        remainingAttempts: failedEvaluation?.execution.round?.remaining_attempts ?? null,
      });
    }
  }

  function handleFailureAcknowledged() {
    setFailure(null);
    // Vider la sélection manuelle rebascule sur le nœud que le moteur vient de
    // rendre actionable, sans reconstruire la règle de branchement ici.
    setActiveId('');
  }

  if (summaryQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (summaryQuery.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-500">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-sm">Impossible de charger la formation.</p>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        Aucune formation disponible.
      </div>
    );
  }

  return (
    <div className="flex flex-1  -mx-4 -mt-2 -mb-4 overflow-hidden bg-white">
      <div className="flex-1 flex flex-col min-w-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100 xl:hidden m-2"
          aria-label="Ouvrir la navigation"
        >
          <Menu className="size-4 text-slate-500" />
        </button>
        {/* Cadre de hauteur fixe, mais conteneur flex : c'est FormationContentView
            qui place la zone scrollable, de sorte que sa barre d'action reste
            visible sous le contenu au lieu d'être poussée hors du cadre. */}
        <main className="flex h-[85vh] flex-col overflow-hidden">
          <ExecutionStatusBanner
            execution={formation.execution}
            requiresRepeat={activeNodeExecution?.requiredToRepeat ?? false}
          />
          <FormationContentView
            formation={formation}
            resolved={resolved}
            onNavigate={handleNavigate}
            onEvaluationComplete={handleEvaluationComplete}
            portalEntry={entryQuery.data ?? null}
            portalEntryLoading={entryQuery.isLoading}
            onMarkComplete={handleMarkComplete}
            isCompleting={isCompleting}
            enrollmentId={enrollmentId}
            executionContext={executionContext}
            canMutate={canMutate}
            onExecutionConflict={handleExecutionConflict}
            registerScormSession={registerScormSession}
            registerVideoSession={registerVideoSession}
          />
        </main>
      </div>

      {failure && (
        <EvaluationFailureDialog
          score={failure.score}
          passingScore={failure.passingScore}
          formationFailed={formation.execution.status === 'failed'}
          target={formation.nodes.find((node) => node.execution.actionable) ?? null}
          remainingAttempts={failure.remainingAttempts}
          onConfirm={handleFailureAcknowledged}
        />
      )}
      <aside
        className={`hidden shrink-0  bg-white xl:flex xl:flex-col sticky top-0 overflow-auto h-[88vh] transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-114 2xl:w-lg'}`}
      >
        <FormationSidebar
          formation={formation}
          activeId={effectiveActiveId}
          onSelect={handleSelect}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </aside>

      {sidebarOpen && (
        <FormationMobileSidebar
          formation={formation}
          activeId={effectiveActiveId}
          onSelect={handleSelect}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
