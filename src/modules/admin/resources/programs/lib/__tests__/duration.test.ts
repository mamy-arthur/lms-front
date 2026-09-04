import { durationToMinutes, formatDuration, minutesToDuration } from '../duration';

describe('duration helpers', () => {
  describe('durationToMinutes', () => {
    it('converts units to minutes', () => {
      expect(durationToMinutes(30, 'minutes')).toBe(30);
      expect(durationToMinutes(2, 'hours')).toBe(120);
      expect(durationToMinutes(1, 'days')).toBe(1440);
      expect(durationToMinutes(1, 'months')).toBe(43200);
      expect(durationToMinutes(1, 'years')).toBe(525600);
    });

    it("n'arrondit jamais une valeur strictement positive à 0 minute", () => {
      expect(durationToMinutes(0.2, 'minutes')).toBe(1);
      expect(durationToMinutes(0.49, 'minutes')).toBe(1);
    });

    it('laisse 0 minute pour une valeur nulle', () => {
      expect(durationToMinutes(0, 'minutes')).toBe(0);
    });
  });

  describe('minutesToDuration', () => {
    it('picks the largest exact unit', () => {
      expect(minutesToDuration(120)).toEqual({ value: 2, unit: 'hours' });
      expect(minutesToDuration(1440)).toEqual({ value: 1, unit: 'days' });
      expect(minutesToDuration(90)).toEqual({ value: 90, unit: 'minutes' });
      expect(minutesToDuration(43200)).toEqual({ value: 1, unit: 'months' });
    });
  });

  describe('formatDuration', () => {
    it('formats null as dash', () => {
      expect(formatDuration(null)).toBe('—');
      expect(formatDuration(undefined)).toBe('—');
    });

    it('formats with french labels', () => {
      expect(formatDuration(1)).toBe('1 minute');
      expect(formatDuration(90)).toBe('90 minutes');
      expect(formatDuration(60)).toBe('1 heure');
      expect(formatDuration(120)).toBe('2 heures');
      expect(formatDuration(1440)).toBe('1 jour');
    });
  });
});
