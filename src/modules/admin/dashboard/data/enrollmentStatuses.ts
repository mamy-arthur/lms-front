import type { EnrollmentStatus } from '@/shared/types/enrollment.types';

export const dashboardEnrollmentStatuses = [
  {
    key: 'completed',
    label: 'Terminées avec succès',
    badgeLabel: 'terminées',
    color: 'bg-emerald-500',
    badgeClassName:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    key: 'in_progress',
    label: 'En cours',
    badgeLabel: 'en cours',
    color: 'bg-amber-500',
    badgeClassName:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    key: 'not_started',
    label: 'Non commencées',
    badgeLabel: 'non commencées',
    color: 'bg-slate-400',
    badgeClassName:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
  {
    key: 'failed',
    label: 'Échouées',
    badgeLabel: 'échouées',
    color: 'bg-red-500',
    badgeClassName:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  },
  {
    key: 'expired',
    label: 'Expirées',
    badgeLabel: 'expirées',
    color: 'bg-violet-500',
    badgeClassName:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300',
  },
] as const satisfies ReadonlyArray<{
  key: EnrollmentStatus;
  label: string;
  badgeLabel: string;
  color: string;
  badgeClassName: string;
}>;
