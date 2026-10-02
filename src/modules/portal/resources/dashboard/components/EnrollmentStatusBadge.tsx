import { Badge } from '@/components/ui/badge';
import type { EnrollmentStatus } from '@/shared/types/enrollment.types';

const statuses: Record<EnrollmentStatus, { label: string; className: string }> = {
  not_started: {
    label: 'Non commencé',
    className:
      'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
  in_progress: {
    label: 'En cours',
    className:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
  },
  completed: {
    label: 'Terminé',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  },
  expired: {
    label: 'Expiré',
    className:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
  },
  failed: {
    label: 'Échoué',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  },
};

// Le backend peut faire évoluer les statuts : ne jamais laisser un statut inconnu casser le rendu.
const UNKNOWN_STATUS = {
  label: 'Statut inconnu',
  className:
    'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300',
};

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  const config = statuses[status] ?? UNKNOWN_STATUS;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
