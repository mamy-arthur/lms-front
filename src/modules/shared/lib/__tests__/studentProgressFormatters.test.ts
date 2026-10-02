import {
  formatAttemptDate,
  formatShortDate,
  formatAttemptDuration,
  formatTrackedDuration,
} from '../studentProgressFormatters';

it.each([
  [0, '0 s'],
  [9, '9 s'],
  [59, '59 s'],
  [60, '1 min'],
  [61, '1 min 1 s'],
  [3600, '1 h'],
  [3605, '1 h 5 s'],
  [3661, '1 h 1 min 1 s'],
  [7200, '2 h'],
])('formate %s secondes sans les confondre avec des minutes', (seconds, label) => {
  expect(formatTrackedDuration(seconds)).toBe(label);
});

it.each([
  [0, '0 min'],
  [45, '45 min'],
  [60, '1 h'],
  [75, '1 h 15 min'],
])('conserve le format de durée théorique %s minutes', (minutes, label) => {
  expect(formatAttemptDuration(minutes)).toBe(label);
});

it('formate les dates en UTC comme la synthèse du parcours', () => {
  expect(formatShortDate('2026-09-28T23:00:00Z')).toBe('28/09/2026');
  expect(formatAttemptDate('2026-09-28T23:00:00Z')).toBe('28 sept. 2026');
});

it('ne fabrique aucune date ou durée sur des valeurs invalides', () => {
  expect(formatShortDate('')).toBe('—');
  expect(formatAttemptDate('invalid')).toBe('—');
  expect(formatTrackedDuration(Number.NaN)).toBe('—');
  expect(formatTrackedDuration(-1)).toBe('—');
  expect(formatAttemptDuration(Infinity)).toBe('—');
});
