import { FileText, FileArchive, Link, ChevronRight } from 'lucide-react';
import type { FormationResource } from '../lib/types';

const RESOURCE_ICON: Record<string, React.ReactNode> = {
  pdf: (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
      <FileText className="h-4 w-4 text-red-500" />
    </div>
  ),
  zip: (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
      <FileArchive className="h-4 w-4 text-amber-500" />
    </div>
  ),
  link: (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
      <Link className="h-4 w-4 text-blue-500" />
    </div>
  ),
  doc: (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
      <FileText className="h-4 w-4 text-green-500" />
    </div>
  ),
};

export function ResourceRow({ resource }: { resource: FormationResource }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
    >
      {RESOURCE_ICON[resource.type] ?? RESOURCE_ICON.pdf}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{resource.title}</p>
        <p className="text-xs text-slate-400 uppercase">{resource.type}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </button>
  );
}
