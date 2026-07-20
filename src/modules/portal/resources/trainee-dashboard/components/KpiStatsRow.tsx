import { BookOpen, CheckCircle, Award, ArrowRight, TrendingUp } from 'lucide-react';
import type { LearningStats } from '@/modules/portal/resources/_shared/trainee/types';

interface KpiStatsRowProps {
  stats: LearningStats;
}

export function KpiStatsRow({ stats }: KpiStatsRowProps) {
  const cards = [
    {
      icon: BookOpen,
      iconColor: 'text-muted-foreground',
      value: stats.enrolledFormations,
      label: 'Formations\ninscrites',
      sub: (
        <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <TrendingUp className="h-3 w-3" />
          {stats.newEnrollments} nouvelles
        </span>
      ),
    },
    {
      icon: CheckCircle,
      iconColor: 'text-muted-foreground',
      value: stats.completedFormations,
      label: 'Formations\nterminées',
      sub: (
        <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <TrendingUp className="h-3 w-3" />
          Bravo !
        </span>
      ),
    },
    {
      icon: Award,
      iconColor: 'text-muted-foreground',
      value: stats.certificatesEarned,
      label: 'Attestations\nobtenues',
      sub: (
        <button className="flex items-center gap-1 text-xs text-muted-foreground font-medium hover:underline">
          Voir toutes <ArrowRight className="h-3 w-3" />
        </button>
      ),
    },
  ];

  return (
    <>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex flex-col items-start justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl`}>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              <p className="mt-0.5 whitespace-pre-line text-xs text-slate-400 leading-tight">
                {card.label}
              </p>
              <div className="mt-2">{card.sub}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}
