'use client';

import { ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TraineeFormation } from './types';

interface FormationCardProps {
  formation: TraineeFormation;
}

export function FormationCard({ formation }: FormationCardProps) {
  const router = useRouter();
  const status =
    formation.status === 'failed'
      ? { label: 'Échouée', className: 'bg-red-100 text-red-700' }
      : formation.status === 'completed'
        ? { label: 'Terminée', className: 'bg-emerald-100 text-emerald-700' }
        : formation.status === 'in_progress'
          ? { label: 'En cours', className: 'bg-(--color-primary)/10 text-(--color-primary)' }
          : { label: 'À commencer', className: 'bg-slate-100 text-slate-600' };

  const progressTone =
    formation.status === 'failed'
      ? { bar: 'bg-red-500', text: 'text-red-600' }
      : formation.status === 'completed'
        ? { bar: 'bg-emerald-500', text: 'text-emerald-600' }
        : { bar: 'bg-(--color-primary)', text: 'text-(--color-primary)' };

  const navigate = () => router.push(`/my-learning-paths/${formation.slug}`);

  return (
    <Card
      className="flex flex-col overflow-hidden pt-0 transition-shadow hover:shadow-md rounded-sm cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={navigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate();
        }
      }}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {formation.coverImage ? (
          <img
            src={formation.coverImage}
            alt={formation.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <ImageIcon className="size-12" strokeWidth={1} />
          </div>
        )}
        {formation.category && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <Badge variant="secondary" className="rounded-sm bg-background/90 text-xs">
              {formation.category}
            </Badge>
          </div>
        )}
      </div>
      <CardHeader>
        <Badge className={`w-fit rounded-sm text-xs ${status.className}`}>{status.label}</Badge>
        <CardTitle className="line-clamp-2 text-sm leading-snug">{formation.title}</CardTitle>
        {formation.description && (
          <p className="line-clamp-2 text-[12px] text-muted-foreground">{formation.description}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 text-xs text-muted-foreground -mt-1">
        <div className="space-y-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all duration-700', progressTone.bar)}
              style={{ width: `${formation.progress}%` }}
            />
          </div>
          <p className={cn('text-right text-xs font-semibold', progressTone.text)}>
            {formation.progress}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
