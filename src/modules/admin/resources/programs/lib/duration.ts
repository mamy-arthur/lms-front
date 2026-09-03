/** Unités de durée affichées / saisies côté UI (stockage API = minutes). */
export type DurationUnit = 'minutes' | 'hours' | 'days' | 'months' | 'years';

export const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Heures' },
  { value: 'days', label: 'Jours' },
  { value: 'months', label: 'Mois' },
  { value: 'years', label: 'Années' },
];

/** Unités proposées pour la validité d'accès. */
export const VALIDITY_UNITS: { value: DurationUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Heures' },
  { value: 'days', label: 'Jours' },
  { value: 'months', label: 'Mois (30 j)' },
  { value: 'years', label: 'Années (365 j)' },
];

const UNIT_TO_MINUTES: Record<DurationUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1_440, // 24 h
  months: 43_200, // 30 jours
  years: 525_600, // 365 jours
};

const UNIT_ORDER: DurationUnit[] = ['years', 'months', 'days', 'hours', 'minutes'];

function pluralLabel(value: number, unit: DurationUnit): string {
  switch (unit) {
    case 'minutes':
      return value === 1 ? 'minute' : 'minutes';
    case 'hours':
      return value === 1 ? 'heure' : 'heures';
    case 'days':
      return value === 1 ? 'jour' : 'jours';
    case 'months':
      return 'mois';
    case 'years':
      return value === 1 ? 'année' : 'années';
  }
}

/** Convertit une valeur + unité UI en minutes (stockage API). */
export function durationToMinutes(value: number, unit: DurationUnit): number {
  return Math.round(value * UNIT_TO_MINUTES[unit]);
}

/**
 * Décompose des minutes en valeur + unité lisible.
 * Choisit la plus grande unité qui divise exactement la valeur.
 */
export function minutesToDuration(minutes: number): { value: number; unit: DurationUnit } {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return { value: 0, unit: 'minutes' };
  }
  for (const unit of UNIT_ORDER) {
    const factor = UNIT_TO_MINUTES[unit];
    if (minutes >= factor && minutes % factor === 0) {
      return { value: minutes / factor, unit };
    }
  }
  return { value: minutes, unit: 'minutes' };
}

/** Libellé français pour affichage tableau (ex. "2 heures"). */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—';
  const { value, unit } = minutesToDuration(minutes);
  return `${value} ${pluralLabel(value, unit)}`;
}
