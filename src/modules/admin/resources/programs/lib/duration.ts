/** Unités de durée affichées / saisies côté UI (stockage API = minutes). */
export type DurationUnit = 'minutes' | 'hours' | 'days' | 'years';

export const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Heures' },
  { value: 'days', label: 'Jours' },
  { value: 'years', label: 'Années (365 j)' },
];

/** Unités proposées pour la validité d'accès. */
export const VALIDITY_UNITS: { value: DurationUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Heures' },
  { value: 'days', label: 'Jours' },
  { value: 'years', label: 'Années (365 j)' },
];

const UNIT_TO_MINUTES: Record<DurationUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1_440, // 24 h
  years: 525_600, // 365 jours
};

const UNIT_ORDER: DurationUnit[] = ['years', 'days', 'hours', 'minutes'];

function pluralLabel(value: number, unit: DurationUnit): string {
  const singular = value === 1;
  switch (unit) {
    case 'minutes':
      return singular ? 'minute' : 'minutes';
    case 'hours':
      return singular ? 'heure' : 'heures';
    case 'days':
      return singular ? 'jour' : 'jours';
    case 'years':
      return singular ? 'an' : 'ans';
  }
}

/** Convertit une valeur + unité UI en minutes (stockage API). */
export function durationToMinutes(value: number, unit: DurationUnit): number {
  const minutes = Math.round(value * UNIT_TO_MINUTES[unit]);
  // Une valeur strictement positive ne doit jamais s'arrondir à 0 minute (ex: 0.2 "Minutes").
  return value > 0 ? Math.max(1, minutes) : minutes;
}

/**
 * Décompose des minutes en valeur + unité lisible.
 * Choisit la plus grande unité atteinte, avec quatre décimales maximum.
 */
export function minutesToDuration(minutes: number): { value: number; unit: DurationUnit } {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return { value: 0, unit: 'minutes' };
  }
  for (const unit of UNIT_ORDER) {
    const factor = UNIT_TO_MINUTES[unit];
    if (minutes >= factor) {
      return { value: Number((minutes / factor).toFixed(4)), unit };
    }
  }
  return { value: minutes, unit: 'minutes' };
}

/** Deux unités non nulles, sans mois (an = 365 jours) ; reste omis. */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—';
  if (!Number.isFinite(minutes) || minutes < 0) return '0 minutes';

  let remaining = Math.round(minutes);
  const parts: string[] = [];
  for (const unit of UNIT_ORDER) {
    const factor = UNIT_TO_MINUTES[unit];
    const value = Math.floor(remaining / factor);
    remaining %= factor;
    if (value > 0) {
      parts.push(`${value.toLocaleString('fr-FR')} ${pluralLabel(value, unit)}`);
      if (parts.length === 2) break;
    }
  }
  if (parts.length === 0) return '0 minutes';
  return parts.join(' et ');
}
