import { durationToMinutes, formatDuration, minutesToDuration } from '../duration';

describe('duration helpers', () => {
  describe('durationToMinutes', () => {
    it('converts units to minutes', () => {
      expect(durationToMinutes(30, 'minutes')).toBe(30);
      expect(durationToMinutes(2, 'hours')).toBe(120);
      expect(durationToMinutes(1, 'days')).toBe(1440);
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
    it('choisit la plus grande unité atteinte, y compris pour les valeurs décimales', () => {
      expect(minutesToDuration(120)).toEqual({ value: 2, unit: 'hours' });
      expect(minutesToDuration(1440)).toEqual({ value: 1, unit: 'days' });
      expect(minutesToDuration(90)).toEqual({ value: 1.5, unit: 'hours' });
      expect(minutesToDuration(2160)).toEqual({ value: 1.5, unit: 'days' });
      expect(minutesToDuration(43200)).toEqual({ value: 30, unit: 'days' });
      expect(minutesToDuration(12 * 43200)).toEqual({ value: 360, unit: 'days' });
      expect(minutesToDuration(4 * 525600)).toEqual({ value: 4, unit: 'years' });
    });

    it.each([0, 1, 59, 61, 90, 1590, 2160, 43200])(
      'préserve les %i minutes lors de la conversion aller-retour du formulaire',
      (minutes) => {
        const { value, unit } = minutesToDuration(minutes);
        expect(durationToMinutes(value, unit)).toBe(minutes);
      },
    );

    it('arrondit le préremplissage à quatre décimales sans zéros superflus', () => {
      expect(minutesToDuration(400 * 1440)).toEqual({ value: 1.0959, unit: 'years' });
      expect(minutesToDuration(1590)).toEqual({ value: 1.1042, unit: 'days' });
      expect(minutesToDuration(4 * 525600 + 1)).toEqual({ value: 4, unit: 'years' });
    });
  });

  describe('affichage des durées', () => {
    it('affiche un tiret pour une durée absente', () => {
      expect(formatDuration(null)).toBe('—');
      expect(formatDuration(undefined)).toBe('—');
    });

    it('affiche les heures et minutes avec les accords français', () => {
      expect(formatDuration(1)).toBe('1 minute');
      expect(formatDuration(90)).toBe('1 heure et 30 minutes');
      expect(formatDuration(60)).toBe('1 heure');
      expect(formatDuration(120)).toBe('2 heures');
      expect(formatDuration(1440)).toBe('1 jour');
    });

    it('affiche les deux plus grandes unités non nulles', () => {
      expect(formatDuration(36 * 60)).toBe('1 jour et 12 heures');
      expect(formatDuration(400 * 1440)).toBe('1 an et 35 jours');
      expect(formatDuration(65 * 1440)).toBe('65 jours');
      expect(formatDuration(2 * 525600)).toBe('2 ans');
      expect(formatDuration(59)).toBe('59 minutes');
      expect(formatDuration(29 * 1440)).toBe('29 jours');
    });

    it('affiche les durées issues de saisies décimales en unités entières', () => {
      expect(formatDuration(durationToMinutes(1.5, 'days'))).toBe('1 jour et 12 heures');
      expect(formatDuration(durationToMinutes(1.25, 'hours'))).toBe('1 heure et 15 minutes');
      expect(formatDuration(durationToMinutes(1.234, 'hours'))).toBe('1 heure et 14 minutes');
    });

    it('omet les unités nulles sans marquer les durées exactes comme approximatives', () => {
      expect(formatDuration(1440 + 5)).toBe('1 jour et 5 minutes');
      expect(formatDuration(525600 + 2 * 1440)).toBe('1 an et 2 jours');
      expect(formatDuration(1440 + 2 * 60)).toBe('1 jour et 2 heures');
      expect(formatDuration(525600 + 60)).toBe('1 an et 1 heure');
    });

    it('omet le reste après deux unités sans arrondir ni ajouter de préfixe', () => {
      expect(formatDuration(1440 + 2 * 60 + 30)).toBe('1 jour et 2 heures');
      expect(formatDuration(1440 + 2 * 60 + 59)).toBe('1 jour et 2 heures');
      expect(formatDuration(525600 + 43200 + 1440 + 60 + 1)).toBe('1 an et 31 jours');
      expect(formatDuration(525600 + 60 + 1)).toBe('1 an et 1 heure');
    });

    it('utilise des années de 365 jours et affiche les anciennes durées en mois en jours', () => {
      expect(formatDuration(525600)).toBe('1 an');
      expect(formatDuration(durationToMinutes(4, 'years'))).toBe('4 ans');
      expect(formatDuration(12 * 43200)).toBe('360 jours');
      expect(formatDuration(30 * 1440)).toBe('30 jours');
      expect(formatDuration(31 * 1440)).toBe('31 jours');
      expect(formatDuration(364 * 1440)).toBe('364 jours');
    });

    it('affiche zéro minute pour une durée nulle ou invalide', () => {
      for (const minutes of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(formatDuration(minutes)).toBe('0 minutes');
      }
    });
  });
});
