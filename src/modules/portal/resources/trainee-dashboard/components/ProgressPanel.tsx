import type { LearningStats } from '@/modules/portal/resources/_shared/trainee/types';

interface WeeklyActivity {
  day: string;
  minutes: number;
}

interface ProgressPanelProps {
  stats: LearningStats;
  activity: WeeklyActivity[];
}

const maxMinutes = 120;

export function ProgressPanel({ stats, activity }: ProgressPanelProps) {
  return (
    <div className="sticky top-4 space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Heures d'apprentissage</p>
            <p className="mt-0.5 text-3xl font-bold text-slate-800">
              {stats.hoursLearned}
              <span className="text-lg font-semibold text-slate-400">h</span>
            </p>
          </div>
          <span
            className="rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            Cette semaine
          </span>
        </div>

        <div className="flex items-end gap-1.5 h-24">
          {activity.map((item) => {
            const heightPct = Math.round((item.minutes / maxMinutes) * 100);
            const todayIndex = (new Date().getDay() + 6) % 7;
            const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            const isToday = days[todayIndex] === item.day;

            return (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="relative w-full overflow-hidden rounded-sm"
                  style={{ height: '68px' }}
                >
                  <div
                    className="absolute bottom-0 w-full rounded-sm transition-all duration-700"
                    style={{
                      background: isToday
                        ? 'var(--color-primary)'
                        : 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
                      height: `${heightPct}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-[9px] font-medium ${isToday ? 'font-bold' : 'text-slate-300'}`}
                  style={isToday ? { color: 'var(--color-primary)' } : undefined}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3 text-xs text-slate-400">
          <span>0</span>
          <span>15</span>
          <span>30</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-slate-800">{stats.completedFormations}</p>
          <p className="mt-0.5 text-xs text-slate-400">Formations terminées</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-center">
          <p className="text-xl font-bold text-slate-800">{stats.certificatesEarned}</p>
          <p className="mt-0.5 text-xs text-slate-400">Attestations</p>
        </div>
        <div className="col-span-2 rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-center">
          <p className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {' '}
            {stats.currentStreak} jours
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Série d'apprentissage</p>
        </div>
      </div>
    </div>
  );
}
