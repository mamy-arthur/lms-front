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
