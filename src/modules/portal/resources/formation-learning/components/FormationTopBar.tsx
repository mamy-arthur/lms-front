'use client';

import { Menu } from 'lucide-react';

interface Props {
  title: string;
  progress: number;
  onOpenSidebar: () => void;
}

export default function FormationTopBar({ title, progress, onOpenSidebar }: Props) {
  return (
    <header className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 shrink-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
      </div>
      <div className="text-xs text-slate-400 shrink-0">{progress}% complété</div>
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100 xl:hidden"
        aria-label="Ouvrir la navigation"
      >
        <Menu className="size-4 text-slate-500" />
      </button>
    </header>
  );
}
