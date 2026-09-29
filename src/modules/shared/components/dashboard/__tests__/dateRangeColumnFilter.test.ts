import {
  EMPTY_DATE_RANGE,
  isDateRangeActive,
  matchesDateRange,
} from '../DateRangeColumnFilter';

/** Une date ISO telle que la produisent les synthèses d'inscription. */
const iso = (day: string) => `${day}T09:00:00.000Z`;

describe('isDateRangeActive', () => {
  it.each([
    [EMPTY_DATE_RANGE, false],
    [{ from: '2026-09-02', to: '' }, true],
    [{ from: '', to: '2026-09-02' }, true],
    [{ from: '2026-09-02', to: '2026-09-03' }, true],
  ])('%o → %s', (range, expected) => {
    expect(isDateRangeActive(range)).toBe(expected);
  });
});

describe('matchesDateRange', () => {
  it('laisse tout passer quand aucune borne n’est saisie', () => {
    expect(matchesDateRange(iso('2026-09-02'), EMPTY_DATE_RANGE)).toBe(true);
    // Même une ligne sans date : il n'y a rien à filtrer.
    expect(matchesDateRange(undefined, EMPTY_DATE_RANGE)).toBe(true);
  });

  it('inclut les deux bornes', () => {
    const range = { from: '2026-09-02', to: '2026-09-04' };

    expect(matchesDateRange(iso('2026-09-01'), range)).toBe(false);
    expect(matchesDateRange(iso('2026-09-02'), range)).toBe(true);
    expect(matchesDateRange(iso('2026-09-03'), range)).toBe(true);
    expect(matchesDateRange(iso('2026-09-04'), range)).toBe(true);
    expect(matchesDateRange(iso('2026-09-05'), range)).toBe(false);
  });

  it('ne borne que par le bas avec la seule date de début', () => {
    const range = { from: '2026-09-03', to: '' };

    expect(matchesDateRange(iso('2026-09-02'), range)).toBe(false);
    expect(matchesDateRange(iso('2026-09-03'), range)).toBe(true);
    expect(matchesDateRange(iso('2030-01-01'), range)).toBe(true);
  });

  it('ne borne que par le haut avec la seule date de fin', () => {
    const range = { from: '', to: '2026-09-03' };

    expect(matchesDateRange(iso('2020-01-01'), range)).toBe(true);
    expect(matchesDateRange(iso('2026-09-03'), range)).toBe(true);
    expect(matchesDateRange(iso('2026-09-04'), range)).toBe(false);
  });

  it('exclut une ligne sans date dès qu’une borne est posée', () => {
    expect(matchesDateRange(undefined, { from: '2026-09-02', to: '' })).toBe(false);
    expect(matchesDateRange(undefined, { from: '', to: '2026-09-02' })).toBe(false);
  });

  it('compare le jour UTC affiché, sans se laisser décaler par l’heure', () => {
    const range = { from: '2026-09-02', to: '2026-09-02' };

    // Même jour UTC, aux deux extrémités de la journée.
    expect(matchesDateRange('2026-09-02T00:00:00.000Z', range)).toBe(true);
    expect(matchesDateRange('2026-09-02T23:59:59.000Z', range)).toBe(true);
    expect(matchesDateRange('2026-09-03T00:00:00.000Z', range)).toBe(false);
  });

  it('gère une plage d’un seul jour', () => {
    const range = { from: '2026-09-02', to: '2026-09-02' };

    expect(matchesDateRange(iso('2026-09-01'), range)).toBe(false);
    expect(matchesDateRange(iso('2026-09-02'), range)).toBe(true);
    expect(matchesDateRange(iso('2026-09-03'), range)).toBe(false);
  });
});
