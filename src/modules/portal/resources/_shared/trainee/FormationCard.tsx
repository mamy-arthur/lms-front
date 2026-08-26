'use client';

import { Clock, CheckCircle2, ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TraineeFormation } from './types';

interface FormationCardProps {
  formation: TraineeFormation;
}

export function FormationCard({ formation }: FormationCardProps) {
  const router = useRouter();

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
        <CardTitle className="line-clamp-2 text-sm leading-snug">{formation.title}</CardTitle>
        {formation.description && (
          <p className="line-clamp-2 text-[12px] text-muted-foreground">{formation.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 text-xs text-muted-foreground -mt-1">
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-(--color-primary) transition-all duration-700"
              style={{ width: `${formation.progress}%` }}
            />
          </div>
          <p className="text-right text-xs font-semibold text-(--color-primary)">
            {formation.progress}%
          </p>
        </div>

        {formation.status === 'completed' ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
            <span>
              {formation.completedDate
                ? `Terminé le ${formation.completedDate}`
                : 'Tous les modules complétés'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" />
            <span>Dernier accès : {formation.lastActivity}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
