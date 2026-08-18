'use client';

import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import type { TraineeFormation } from '@/modules/portal/resources/_shared/trainee/types';

interface FeaturedFormationCardProps {
  formation: TraineeFormation;
}

export function FeaturedFormationCard({ formation }: FeaturedFormationCardProps) {
  const router = useRouter();
  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm">
      <div className="flex h-full">
        <div className="relative shrink-0 w-44 bg-gradient-to-br from-orange-500/60 to-orange-700/70">
          {formation.coverImage ? (
            <img
              src={formation.coverImage}
              alt={formation.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/60 to-orange-700/70" />
        </div>

        <div className="flex flex-1 flex-col justify-between p-5 gap-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
              Reprendre
            </p>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">{formation.title}</h2>

            {formation.currentLesson && (
              <div>
                <p className="text-[11px] text-slate-400">Module actuel</p>
                <p className="text-xs font-medium text-slate-700">{formation.currentLesson}</p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-700"
                style={{ width: `${formation.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-end">
              <span className="text-sm font-bold text-slate-700">{formation.progress}%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/my-learning-paths/${formation.slug}`)}
              className="flex items-center gap-2 rounded-xl border bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
            >
              Continuer <Play className="h-3 w-3.5 fill-white" />
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              Voir le dernier contenu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
