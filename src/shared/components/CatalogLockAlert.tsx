'use client';

import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface Props {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standing notice for the catalogue sale lock.
 *
 * The amber is spelled out here rather than added as an Alert variant: the
 * components under `components/ui` are vendored shadcn files and stay untouched,
 * and the theme carries no `warning` token. Keeping the palette in one place
 * means the dark-mode pairs are not re-derived at each call site.
 *
 * `role="status"`, not the component's default `role="alert"` — this is a
 * constraint that simply holds, not something that just went wrong.
 */
export function CatalogLockAlert({ title, children, className }: Props) {
  return (
    <Alert
      role="status"
      className={cn(
        'w-fit rounded-sm border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100',
        className,
      )}
    >
      <Lock />
      <AlertTitle>{title}</AlertTitle>
      {/* AlertDescription carries its own text-muted-foreground, so colouring the
          parent alone would leave the body grey. */}
      <AlertDescription className="text-amber-800 dark:text-amber-200/90">
        {children}
      </AlertDescription>
    </Alert>
  );
}
