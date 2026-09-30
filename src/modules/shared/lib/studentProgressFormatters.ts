/** Theoretical durations are expressed in minutes by the catalog API. */
export function formatAttemptDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return '—';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  return `${hours} h${remainder ? ` ${remainder} min` : ''}`;
}

/** Tracked durations are seconds, never rounded up to a fictitious minute. */
export function formatTrackedDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return (
    [hours && `${hours} h`, minutes && `${minutes} min`, remainder && `${remainder} s`]
      .filter(Boolean)
      .join(' ') || '0 s'
  );
}

const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});
const attemptDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatDate(date: string, formatter: Intl.DateTimeFormat): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return formatter.format(parsed);
}

export function formatShortDate(date: string): string {
  return formatDate(date, shortDateFormatter);
}

export function formatAttemptDate(date: string): string {
  return formatDate(date, attemptDateFormatter);
}
