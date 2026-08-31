'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';
import { AlertTriangle } from 'lucide-react';

export function DevBanner() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center px-2 py-2 cursor-default">
            <span className="text-base leading-none">
              {' '}
              <AlertTriangle size={16} />
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">Projet en développement</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="rounded-sm border border-sidebar-border bg-(--color-primary) px-3 py-2.5 text-white">
      <div className="flex items-center gap-2">
        <span className="text-sm leading-none">
          <AlertTriangle size={16} />
        </span>
        <span className="text-xs font-medium text-white">Projet en développement</span>
      </div>
      <p className="mt-1 text-[10px] text-white pl-5">
        Des améliorations sont régulièrement apportées.
      </p>
    </div>
  );
}
