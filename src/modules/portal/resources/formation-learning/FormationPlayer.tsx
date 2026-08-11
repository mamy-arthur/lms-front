'use client';

import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { MOCK_FORMATION } from './lib/course-data';
import { getDefaultActiveId, resolveActive } from './lib/course-utils';
import { useFormationSummaryQuery } from './hooks/useFormationSummaryQuery';
import { usePortalContentEntryQuery } from './hooks/usePortalContentEntryQuery';
import FormationSidebar from './components/FormationSidebar';
import FormationContentView from './components/FormationContentView';
import FormationMobileSidebar from './components/FormationMobileSidebar';

interface Props {
  /** Learning path UUID (or slug during development). Falls back to mock data when absent. */
  learningPathId?: string;
}

export default function FormationPlayer({ learningPathId }: Props) {
  const summaryQuery = useFormationSummaryQuery(learningPathId);

  const isRealMode = !!learningPathId;
  const formation = isRealMode ? (summaryQuery.data ?? null) : MOCK_FORMATION;

  const [activeId, setActiveId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialise activeId once the formation is available.
  const effectiveActiveId = activeId || (formation ? getDefaultActiveId(formation) : '');

  const resolved = formation ? resolveActive(formation, effectiveActiveId) : null;

  // For real mode: derive courseId from the resolved content (sectionId === courseId in the mapper).
  const activeCourseId =
    isRealMode && resolved?.kind === 'content' ? resolved.content.sectionId : null;
  const activeEntryId = isRealMode && resolved?.kind === 'content' ? resolved.content.id : null;

  const entryQuery = usePortalContentEntryQuery(activeCourseId, activeEntryId);

  function handleSelect(id: string) {
    setActiveId(id);
    setSidebarOpen(false);
  }

  function handleNavigate(id: string | null) {
    if (id) setActiveId(id);
  }

  function handleEvaluationComplete(score: number, passed: boolean) {
    console.log('Evaluation completed', score, passed);
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
        <main className="h-[88vh] overflow-y-auto">
          <FormationContentView
            formation={formation}
            resolved={resolved}
            onNavigate={handleNavigate}
            onEvaluationComplete={handleEvaluationComplete}
            portalEntry={isRealMode ? (entryQuery.data ?? null) : undefined}
            portalEntryLoading={isRealMode ? entryQuery.isFetching : undefined}
          />
        </main>
      </div>

      <aside className="hidden w-88 2xl:w-104 shrink-0 border-l border-slate-100 bg-white xl:flex xl:flex-col sticky top-0 overflow-hidden">
        <FormationSidebar
          formation={formation}
          activeId={effectiveActiveId}
          onSelect={handleSelect}
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
