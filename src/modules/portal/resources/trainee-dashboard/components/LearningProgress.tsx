import { Award, BookCheck, Clock4, Zap } from 'lucide-react';
import type { LearningStats } from '@/modules/portal/resources/_shared/trainee/types';

interface WeeklyActivity {
  day: string;
  minutes: number;
}

interface LearningProgressProps {
  stats: LearningStats;
  activity: WeeklyActivity[];
}

const maxMinutes = 120;

export function LearningProgress({ stats, activity }: LearningProgressProps) {
  const kpis = [
    {
      icon: BookCheck,
      label: 'Formations terminées',
      value: stats.completedFormations,
      unit: '',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      icon: Clock4,
      label: 'Heures apprises',
      value: stats.hoursLearned,
      unit: 'h',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      icon: Award,
      label: 'Attestations',
      value: stats.certificatesEarned,
      unit: '',
      color: 'text-violet-500',
      bg: 'bg-violet-50',
    },
    {
      icon: Zap,
      label: 'Série actuelle',
      value: stats.currentStreak,
      unit: 'j',
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-800">Progression d'apprentissage</h2>
        <p className="mt-0.5 text-xs text-slate-400">Vos statistiques globales</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="flex flex-col gap-2 rounded-xl border border-slate-50 bg-slate-50/50 p-4"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg}`}>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {kpi.value}
                  <span className="text-base font-semibold text-slate-500">{kpi.unit}</span>
                </p>
                <p className="text-xs text-slate-400">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Activité hebdomadaire</p>
          <p className="text-xs text-slate-400">minutes / jour</p>
        </div>
        <div className="flex items-end gap-2 h-28">
          {activity.map((item) => {
            const heightPct = Math.round((item.minutes / maxMinutes) * 100);
            const isToday =
              ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][(new Date().getDay() + 6) % 7] ===
              item.day;

            return (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-500">{item.minutes}m</span>
                <div
                  className="relative w-full overflow-hidden rounded-md bg-slate-100"
                  style={{ height: '72px' }}
                >
                  <div
                    className={`absolute bottom-0 w-full rounded-md transition-all duration-700 ${
                      isToday
                        ? 'bg-gradient-to-t from-indigo-600 to-violet-500'
                        : 'bg-gradient-to-t from-indigo-300 to-indigo-200'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
