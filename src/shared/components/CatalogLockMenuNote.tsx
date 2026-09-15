'use client';

import { Lock } from 'lucide-react';

/**
 * Why the greyed-out entries of a dropdown menu are greyed out.
 *
 * A caption, not a tooltip: a disabled menu item never receives the hover Radix
 * would need to open one, so the explanation has to sit in the menu itself.
 *
 * Renders nothing without a reason — a lock with no origin to name would leave an
 * empty separator hanging under the last item.
 */
export function CatalogLockMenuNote({ reason }: { reason: string }) {
  if (!reason) return null;

  return (
    <p className="flex items-start gap-1.5 border-t px-2 py-2 text-[11px] leading-snug text-muted-foreground">
      <Lock className="mt-0.5 size-3 shrink-0" />
      <span>{reason}</span>
    </p>
  );
}
