/**
 * Prépare une chaîne pour une comparaison de recherche : sans accents, en
 * minuscules et sans espaces de bord. À appliquer aux deux côtés de la
 * comparaison pour que « Prévenir » soit trouvé en tapant «  PREVENIR  ».
 *
 * `NFD` sépare chaque lettre accentuée de son accent, que la classe Unicode
 * `\p{M}` (marques combinantes) retire ensuite.
 */
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr-FR').trim();
}
