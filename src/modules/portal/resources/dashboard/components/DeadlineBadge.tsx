/**
 * DeadlineBadge — affiche une alerte visuelle selon l'échéance d'un étudiant.
 *
 * Seuils configurables :
 *   WARNING_DAYS  : nombre de jours avant échéance pour le badge jaune
 *   URGENT_DAYS   : nombre de jours avant échéance pour le badge orange
 */

import type { EnrollmentStatus } from '@/shared/types/enrollment.types';

const WARNING_DAYS = 7; // jaune  : entre URGENT_DAYS+1 et WARNING_DAYS jours
const URGENT_DAYS = 3; //  orange : entre 1 et URGENT_DAYS jours restants

interface DeadlineBadgeProps {
  /** Date d'échéance au format ISO YYYY-MM-DD. Si absent, rien n'est rendu. */
  deadline?: string;
  /** Progression de l'étudiant, utilisée seulement si le statut réel n'est pas fourni. */
  progress: number;
  /** Le statut est affiché séparément : aucune alerte d'échéance pour une inscription terminée. */
  status?: EnrollmentStatus;
}

function diffDays(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  // Comparaison à minuit pour ignorer l'heure
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toMidnight.getTime() - fromMidnight.getTime()) / msPerDay);
}

export function DeadlineBadge({ deadline, progress, status }: DeadlineBadgeProps) {
  if (!deadline || status === 'completed') return null;

  const today = new Date();
  const dueDate = new Date(deadline + 'T00:00:00');
  const days = diffDays(today, dueDate);

  if (status === undefined && progress >= 100) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        Terminé
      </span>
    );
  }

  if (days < 0) {
    // Échéance dépassée
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        En retard
      </span>
    );
  }

  if (days === 0) {
    // Échéance aujourd'hui
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        Échéance aujourd&apos;hui
      </span>
    );
  }

  if (days <= URGENT_DAYS) {
    // Imminente (1 à URGENT_DAYS jours)
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
        Plus que {days} jour{days > 1 ? 's' : ''}
      </span>
    );
  }

  if (days <= WARNING_DAYS) {
    // Proche (URGENT_DAYS+1 à WARNING_DAYS jours)
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
        Échéance proche
      </span>
    );
  }

  // Plus de WARNING_DAYS jours → rien
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
      Échéance lointaine
    </span>
  );
}
