'use client';

import { X } from 'lucide-react';
import FormationSidebar from './FormationSidebar';
import type { Formation } from '../lib/types';

interface Props {
  formation: Formation;
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function FormationMobileSidebar({ formation, activeId, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-40 xl:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 flex h-full w-[22rem] flex-col bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 shrink-0">
          <span className="text-xs font-semibold text-slate-400">{formation.title}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-slate-100"
            aria-label="Fermer la navigation"
          >
            <X className="size-5 text-slate-500" />
          </button>
        </div>
        <FormationSidebar formation={formation} activeId={activeId} onSelect={onSelect} />
      </div>
    </div>
  );
}
