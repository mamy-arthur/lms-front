'use client';

import { useState } from 'react';
import { MOCK_FORMATION } from './lib/course-data';
import { getDefaultActiveId, resolveActive } from './lib/course-utils';
import FormationSidebar from './components/FormationSidebar';
import FormationTopBar from './components/FormationTopBar';
import FormationContentView from './components/FormationContentView';
import FormationMobileSidebar from './components/FormationMobileSidebar';

export default function FormationPlayer() {
  const formation = MOCK_FORMATION;
  const [activeId, setActiveId] = useState(() => getDefaultActiveId(formation));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const resolved = resolveActive(formation, activeId);

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

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden -mx-4 -mt-2 -mb-4 rounded-2xl bg-white">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FormationTopBar
          title={formation.title}
          progress={formation.progress}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <FormationContentView
            formation={formation}
            resolved={resolved}
            onNavigate={handleNavigate}
            onEvaluationComplete={handleEvaluationComplete}
          />
        </main>
      </div>

      <aside className="hidden w-[22rem] 2xl:w-[26rem] shrink-0 border-l border-slate-100 bg-white xl:flex xl:flex-col overflow-hidden">
        <FormationSidebar formation={formation} activeId={activeId} onSelect={handleSelect} />
      </aside>

      {sidebarOpen && (
        <FormationMobileSidebar
          formation={formation}
          activeId={activeId}
          onSelect={handleSelect}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
