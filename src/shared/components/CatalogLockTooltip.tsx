'use client';

import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  /** When false the children render untouched — no wrapper span, no tooltip. */
  locked: boolean;
  reason: string;
  children: ReactNode;
}

/**
 * Explains why a control is disabled by the catalogue sale lock.
 *
 * The span is not decoration: a disabled button swallows pointer events, so Radix
 * never sees the hover and the tooltip would never open. Wrapping restores the
 * hover target while leaving the control itself inert — same pattern as the SCORM
 * publish switch in ContentSection.
 */
export function CatalogLockTooltip({ locked, reason, children }: Props) {
  if (!locked) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
