'use client';

import { Clock, CheckCircle2, Play, Award, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { TraineeFormation, FormationStatus } from './types';

const STATUS_CONFIG: Record<FormationStatus, { label: string; className: string }> = {
  in_progress: {
    label: 'En cours',
    className: 'bg-white text-[#5f5e5a]',
  },
  completed: {
    label: 'Terminé',
    className: 'bg-[#EAF3DE] text-[#27500A]',
  },
  not_started: {
    label: 'Non commencé',
    className: 'bg-white text-[#5f5e5a]',
  },
};

interface FormationCardProps {
  formation: TraineeFormation;
}

export function FormationCard({ formation }: FormationCardProps) {
  const router = useRouter();
  const status = STATUS_CONFIG[formation.status];

  const handleClick = () => {
    router.push(`/mes-formations/${formation.slug}`);
  };

  const handleCta = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/mes-formations/${formation.slug}`);
  };

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="relative h-44 shrink-0 overflow-hidden bg-slate-100">
        {formation.coverImage && (
          <img
            src={formation.coverImage}
            alt={formation.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span
          className={cn(
            'absolute right-3 top-3 rounded-[20px] px-2 py-[3px] text-[10px] font-medium',
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
            {formation.title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {formation.category} • {formation.totalModules} modules
          </p>
        </div>

        <div className="space-y-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-700"
              style={{ width: `${formation.progress}%` }}
            />
          </div>
          <p className="text-right text-xs font-bold text-[var(--color-primary)]">
            {formation.progress}%
          </p>
        </div>

        <div className="space-y-1 text-xs text-slate-400">
          {formation.status === 'completed' ? (
            <>
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                Tous les modules complétés
              </p>
              {formation.completedDate && (
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Terminé le : {formation.completedDate}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                Module {formation.completedModules} sur {formation.totalModules}
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {formation.status === 'not_started'
                  ? formation.lastActivity
                  : `Dernier accès : ${formation.lastActivity}`}
              </p>
            </>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          {formation.status === 'completed' ? (
            <button
              type="button"
              onClick={handleCta}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 transition-all hover:bg-[#f4f3ee] active:scale-[0.98]"
            >
              <Award className="h-3.5 w-3.5" />
              Voir l'attestation
            </button>
          ) : formation.status === 'not_started' ? (
            <button
              type="button"
              onClick={handleCta}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 transition-all hover:bg-[#f4f3ee] active:scale-[0.98]"
            >
              <Play className="h-3.5 w-3.5" />
              Commencer
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCta}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 transition-all hover:bg-[#f4f3ee] active:scale-[0.98]"
            >
              <Play className="h-3.5 w-3.5" />
              Continuer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
