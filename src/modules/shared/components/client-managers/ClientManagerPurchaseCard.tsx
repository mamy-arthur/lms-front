'use client';

import { BookOpen, ClipboardCheck, Layers } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ClientManagerPurchasedLearningPath } from '@/shared/types/client-manager-detail.types';

export function ClientManagerPurchaseCard({
  purchase,
}: {
  purchase: ClientManagerPurchasedLearningPath;
}) {
  const formation = purchase.learning_path;
  const title = formation?.name || 'Formation indisponible';
  return (
    <li className="@container/card rounded-xl border bg-background p-4 sm:p-5">
      <article aria-label={title} className="flex flex-col gap-5 @lg/card:flex-row">
        <Avatar className="size-20 shrink-0 rounded-xs after:rounded-sm sm:size-24">
          <AvatarImage src={formation?.image?.url} alt="" className="rounded-xs object-cover" />
          <AvatarFallback className="rounded-xs bg-muted text-[var(--trainee-accent)]">
            <BookOpen className="size-8" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="font-semibold break-words">
              {title}{' '}
              {formation?.category_name && (
                <Badge variant="outline">{formation.category_name}</Badge>
              )}
            </h3>
            {formation?.description && (
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                {formation.description}
              </p>
            )}
          </div>
        </div>
        <dl className="flex shrink-0 flex-col gap-3 border-t pt-4 text-xs text-muted-foreground @lg/card:justify-center @lg/card:border-t-0 @lg/card:border-l @lg/card:pt-0 @lg/card:pl-5">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Layers className="size-4 shrink-0" aria-hidden="true" />
            <dt>Modules</dt>
            <dd className="font-medium text-foreground tabular-nums">{purchase.modules_count}</dd>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <ClipboardCheck className="size-4 shrink-0" aria-hidden="true" />
            <dt>Évaluations</dt>
            <dd className="font-medium text-foreground tabular-nums">
              {purchase.evaluations_count}
            </dd>
          </div>
        </dl>
      </article>
    </li>
  );
}
