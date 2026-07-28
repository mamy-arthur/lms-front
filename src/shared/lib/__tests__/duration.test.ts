import { formatDuration } from '../duration';

describe('formatDuration', () => {
  it('returns only minutes when duration is less than 60', () => {
    expect(formatDuration(30)).toBe('30min');
    expect(formatDuration(1)).toBe('1min');
    expect(formatDuration(59)).toBe('59min');
  });

  it('returns only hours when there are no remaining minutes', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(180)).toBe('3h');
  });

  it('returns hours and minutes when both are non-zero', () => {
    expect(formatDuration(90)).toBe('1h30min');
    expect(formatDuration(125)).toBe('2h5min');
    expect(formatDuration(75)).toBe('1h15min');
  });

  it('never displays "0h"', () => {
    expect(formatDuration(30)).not.toContain('0h');
    expect(formatDuration(45)).not.toContain('0h');
  });

  it('never displays "0min"', () => {
    expect(formatDuration(60)).not.toContain('0min');
    expect(formatDuration(120)).not.toContain('0min');
  });

  it('handles edge case of 0 minutes', () => {
    expect(formatDuration(0)).toBe("il n'y a pas de durée");
  });
});
