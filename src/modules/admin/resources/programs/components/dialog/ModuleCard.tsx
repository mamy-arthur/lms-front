'use client';

import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { ModuleOverviewPanel } from './ModuleOverviewPanel';

export type ModuleCardProps = {
  id: string;
  shortname: string;
  categoryName: string | null;
  courseCount: number;
  isSelected: boolean;
  isAdded: boolean;
  hasCourses: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
};

export function ModuleCard({
  id,
  shortname,
  categoryName,
  courseCount,
  isSelected,
  isAdded,
  hasCourses,
  isExpanded,
  onSelect,
  onToggleExpand,
}: ModuleCardProps) {
  const isDisabled = isAdded || !hasCourses;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border transition-all duration-200',
        isDisabled
          ? 'cursor-default'
          : isSelected
            ? 'border-(--color-primary)/60 bg-(--color-primary)/10 shadow-sm'
            : 'border-border hover:-translate-y-0.5 hover:border-(--color-primary)/60 hover:bg-muted/20 hover:shadow-md',
      )}
    >
      {/* Main row */}
      <div
        role={!isDisabled ? 'button' : undefined}
        tabIndex={!isDisabled ? 0 : undefined}
        onClick={!isDisabled ? onSelect : undefined}
        onKeyDown={
          !isDisabled
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect();
                }
              }
            : undefined
        }
        className={cn('flex items-start gap-3 px-4 py-3 pr-10', !isDisabled && 'cursor-pointer')}
      >
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-xs font-semibold leading-snug',
              isDisabled ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {shortname}
          </p>
          <div className="flex justify-between gap-2 items-center">
            {isAdded && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                <CheckCircle2 className="size-3 shrink-0" />
                Déjà dans ce parcours
              </span>
            )}

            {!hasCourses && !isAdded && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <AlertTriangle className="size-3 shrink-0" />
                Aucun cours associé
              </span>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {categoryName && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {categoryName}
                </span>
              )}

              <span className="text-[10px] text-muted-foreground">{courseCount} cours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expand button */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
        className={cn(
          'absolute right-2 top-2 rounded-md p-1.5 transition-colors',
          isExpanded ? 'bg-muted text-black' : 'text-black hover:bg-muted hover:text-foreground',
        )}
        aria-label={isExpanded ? 'Replier les détails' : 'Voir les détails'}
      >
        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {/* Details */}
      {isExpanded && (
        <div>
          <ModuleOverviewPanel moduleId={id} />
        </div>
      )}
    </div>
  );
}
