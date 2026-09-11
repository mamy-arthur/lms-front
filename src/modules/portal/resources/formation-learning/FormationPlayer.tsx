'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, Menu } from 'lucide-react';
import { MOCK_FORMATION } from './lib/course-data';
import { getDefaultActiveId, resolveActive } from './lib/course-utils';
import type { Formation } from './lib/types';
import { useFormationSummaryQuery } from './hooks/useFormationSummaryQuery';
import { usePortalContentEntryQuery } from './hooks/usePortalContentEntryQuery';
import { useMarkContentCompleteMutation } from './hooks/useMarkContentCompleteMutation';
import { portalLearningPathKeys } from '@/shared/queries/keys';
import FormationSidebar from './components/FormationSidebar';
import FormationContentView from './components/FormationContentView';
import FormationMobileSidebar from './components/FormationMobileSidebar';

interface Props {
  /** Enrollment UUID. Falls back to mock data when absent. */
  enrollmentId?: string;
}

export default function FormationPlayer({ enrollmentId }: Props) {
  const queryClient = useQueryClient();
  const summaryQuery = useFormationSummaryQuery(enrollmentId);

  const isRealMode = !!enrollmentId;
  const formation = isRealMode ? (summaryQuery.data ?? null) : MOCK_FORMATION;

  const [activeId, setActiveId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialise activeId once the formation is available.
  const effectiveActiveId = activeId || (formation ? getDefaultActiveId(formation) : '');

  const resolved = formation ? resolveActive(formation, effectiveActiveId) : null;

  // For real mode: derive courseId from the resolved content.
  const activeCourseId =
    isRealMode && resolved?.kind === 'content' ? resolved.content.courseId : null;
  const activeEntryId =
    isRealMode && resolved?.kind === 'content' ? (resolved.content.entryId ?? null) : null;

  const entryQuery = usePortalContentEntryQuery(
    isRealMode ? (enrollmentId ?? null) : null,
    activeCourseId,
    activeEntryId,
  );

  const { mutate: markComplete, isPending: isCompleting } = useMarkContentCompleteMutation(
    enrollmentId ?? '',
  );

  function handleMarkComplete(onDone?: () => void) {
    if (
      !enrollmentId ||
      !activeCourseId ||
      !activeEntryId ||
      isCompleting ||
      resolved?.kind !== 'content' ||
      resolved.content.completed
    ) {
      return;
    }
    markComplete(
      { competencyId: resolved.node.id, courseId: activeCourseId, entryId: activeEntryId },
      { onSuccess: onDone },
    );
  }

  function handleSelect(id: string) {
    if (isCompleting) return;
    handleNavigate(id);
    setSidebarOpen(false);
  }

  function handleNavigate(id: string | null) {
    // A completion callback holds the previous render's formation. Consult the
    // refreshed cache so it can only navigate to a genuinely unlocked successor.
    const currentFormation = enrollmentId
      ? queryClient.getQueryData<Formation>(portalLearningPathKeys.summary(enrollmentId))
      : formation;
    if (id && currentFormation && resolveActive(currentFormation, id)) setActiveId(id);
  }

  function handleEvaluationComplete() {
    if (enrollmentId) {
      queryClient.invalidateQueries({ queryKey: portalLearningPathKeys.summary(enrollmentId) });
    }
  }

  if (isRealMode && summaryQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isRealMode && summaryQuery.isError) {
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
          <FormationContentView
            formation={formation}
            resolved={resolved}
            onNavigate={handleNavigate}
            onEvaluationComplete={handleEvaluationComplete}
            portalEntry={isRealMode ? (entryQuery.data ?? null) : undefined}
            portalEntryLoading={isRealMode ? entryQuery.isLoading : undefined}
            onMarkComplete={isRealMode ? handleMarkComplete : undefined}
            isCompleting={isRealMode ? isCompleting : undefined}
            enrollmentId={isRealMode ? enrollmentId : undefined}
          />
        </main>
      </div>
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
