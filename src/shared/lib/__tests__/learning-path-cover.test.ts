/**
 * Tests unitaires — repli de couverture des parcours
 */

import { DEFAULT_LEARNING_PATH_COVER, learningPathCover } from '../learning-path-cover';

describe('learningPathCover', () => {
  it('conserve une URL fournie', () => {
    expect(learningPathCover('https://cdn.example.test/cover.webp')).toBe(
      'https://cdn.example.test/cover.webp',
    );
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('retourne le visuel par défaut pour %s', (_label, value) => {
    expect(learningPathCover(value)).toBe(DEFAULT_LEARNING_PATH_COVER);
  });

  it.each([
    ['chaîne vide', ''],
    ['espaces seuls', '   '],
  ])(
    // Une chaîne blanche dans src déclenche une requête vers la page courante,
    // dont la réponse HTML s'affiche comme une image cassée.
    'traite une %s comme une absence',
    (_label, value) => {
      expect(learningPathCover(value)).toBe(DEFAULT_LEARNING_PATH_COVER);
    },
  );

  it('pointe vers un asset de public/', () => {
    expect(DEFAULT_LEARNING_PATH_COVER).toBe('/assets/learning-path-cover.svg');
  });
});
