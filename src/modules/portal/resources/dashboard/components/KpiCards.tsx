import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ClientDashboardOverview } from '../types';

const kpis = [
  {
    label: 'Parcours',
    description: 'Nombre de parcours suivis',
    key: 'learning_paths',
    position: 'col-start-1 row-start-1',
  },
  {
    label: 'Terminées',
    description: 'Inscriptions terminées',
    key: 'completed',
    position: 'col-start-2 row-start-1',
    highlighted: true,
  },
  {
    label: 'En cours',
    description: 'Inscriptions en cours',
    key: 'in_progress',
    position: 'col-start-1 row-start-2',
  },
  {
    label: 'À faire',
    description: 'Inscriptions non commencées',
    key: 'not_started',
    position: 'col-start-2 row-start-2',
  },
] as const;

export function KpiCards({ data }: { data: ClientDashboardOverview | undefined }) {
  return (
    <>
      {kpis.map((kpi) => {
        const highlighted = 'highlighted' in kpi && kpi.highlighted;

        return (
          <Card
            key={kpi.label}
            className={cn(
              kpi.position,
              'relative isolate min-w-0 overflow-hidden bg-card transition-all duration-200',
              highlighted && 'border-none bg-(--color-primary)/10',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute -right-2 -bottom-5 size-28 -rotate-12',
                highlighted
                  ? 'text-(--color-primary)/20'
                  : 'text-slate-300/40 dark:text-slate-600/30',
              )}
            >
              <span className="absolute inset-0 translate-x-5 translate-y-3 rounded-2xl bg-current opacity-40" />
              <span className="absolute inset-0 rounded-2xl border border-current" />
              <span className="absolute inset-0 -translate-x-5 -translate-y-3 rounded-2xl border border-current" />
            </span>
            <CardContent className="relative z-10 flex min-h-28 flex-1 flex-col justify-between gap-3 wrap-break-word">
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className={cn(
                      'text-xs font-bold uppercase tracking-wide',
                      highlighted && 'text-(--color-primary)',
                    )}
                  >
                    {kpi.label}
                  </p>

                  {kpi.description && (
                    <p
                      className={cn(
                        'mt-1 text-xs text-gray-500',
                        highlighted && 'text-muted-foreground',
                      )}
                    >
                      {kpi.description}
                    </p>
                  )}
                </div>
              </div>
              <p
                className={cn(
                  'text-3xl tracking-tight text-black',
                  highlighted && 'text-(--color-primary)',
                )}
              >
                {data
                  ? kpi.key === 'learning_paths'
                    ? data.learning_paths
                    : data.enrollments[kpi.key]
                  : '—'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
