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
    <div className="rounded-sm bg-(--color-primary)/10 px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-primary)/15 text-(--color-primary)">
          <AlertTriangle size={14} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-(--color-primary)">
              Projet en développement
            </span>

            <span className="rounded-full bg-(--color-primary)/15 px-1.5 py-0.5 text-[9px] font-medium text-(--color-primary)">
              Bêta
            </span>
          </div>

          <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
            Des améliorations sont régulièrement apportées pour améliorer votre expérience.
          </p>
        </div>
      </div>
    </div>
  );
}
