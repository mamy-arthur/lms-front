/**
 * Converts a number of minutes into a human-readable duration string.
 *
 * Examples:
 *   30  → "30min"
 *   60  → "1h"
 *   90  → "1h30min"
 *   120 → "2h"
 *   125 → "2h5min"
 */
export function formatDuration(minutes: number): string {
  if (minutes === 0) {
    return "il n'y a pas de durée";
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h${remainingMinutes}min`;
}

const UNIT_TO_MINUTES: Record<string, number> = {
  minutes: 1,
  hours: 60,
  days: 1_440,
  months: 43_200,
  years: 525_600,
};

const UNIT_ORDER = ['years', 'months', 'days', 'hours', 'minutes'] as const;

const UNIT_LABELS: Record<string, [string, string]> = {
  minutes: ['minute', 'minutes'],
  hours: ['heure', 'heures'],
  days: ['jour', 'jours'],
  months: ['mois', 'mois'],
  years: ['année', 'années'],
};

/** Formats a minute count as a human-readable validity label (e.g. "3 jours"). */
export function formatValidityDuration(minutes: number): string {
  for (const unit of UNIT_ORDER) {
    const factor = UNIT_TO_MINUTES[unit];
    if (minutes >= factor && minutes % factor === 0) {
      const value = minutes / factor;
      const [singular, plural] = UNIT_LABELS[unit];
      return `${value} ${value === 1 ? singular : plural}`;
    }
  }
  return `${minutes} minutes`;
}
