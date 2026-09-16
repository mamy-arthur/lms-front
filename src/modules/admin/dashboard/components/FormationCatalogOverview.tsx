import { BookOpen, CheckCircle2, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formationProgressDemo, type FormationProgressDemo } from '../data/studentProgressDemo';

export function FormationCatalogOverview({
  formations = formationProgressDemo,
}: {
  formations?: Pick<FormationProgressDemo, 'isPublished'>[];
}) {
  const published = formations.filter((formation) => formation.isPublished).length;
  const indicators = [
    { label: 'Total des formations', value: formations.length, icon: BookOpen, highlighted: false },
    { label: 'Publiées', value: published, icon: CheckCircle2, highlighted: true },
    {
      label: 'Non publiées',
      value: formations.length - published,
      icon: EyeOff,
      highlighted: false,
    },
  ];

  return (
    <section aria-label="Catalogue des formations" className="bg-card">
      <dl className="grid grid-cols-3 gap-2">
        {indicators.map(({ label, value, icon: Icon, highlighted }) => (
          <div
            key={label}
            className={cn(
              'relative isolate flex flex-col gap-16 overflow-hidden rounded-sm border border-gray-100 px-4 py-3',
              highlighted &&
                'border-none bg-linear-to-br from-emerald-50 to-emerald-100/60 dark:border-emerald-900 dark:from-emerald-950 dark:to-emerald-950/40',
            )}
          >
            <dt
              className={cn(
                'relative z-10 flex items-center gap-2 text-xs text-muted-foreground',
                highlighted && 'text-emerald-800 dark:text-emerald-200',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </dt>
            <dd
              className={cn(
                'text-4xl tabular-nums',
                highlighted && 'text-emerald-950 dark:text-emerald-100',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute -right-2 -bottom-5 size-28 -rotate-12',
                  highlighted
                    ? 'text-emerald-300/40 dark:text-emerald-700/30'
                    : 'text-slate-300/40 dark:text-slate-600/30',
                )}
              >
                <span className="absolute inset-0 translate-x-5 translate-y-3 rounded-2xl bg-current opacity-40" />
                <span className="absolute inset-0 rounded-2xl border border-current" />
                <span className="absolute inset-0 -translate-x-5 -translate-y-3 rounded-2xl border border-current" />
              </span>
              <span className="relative z-10">{value.toLocaleString('fr-FR')}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
