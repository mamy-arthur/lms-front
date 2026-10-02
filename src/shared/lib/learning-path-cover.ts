/**
 * Visuel de repli des parcours sans image.
 *
 * Le backend renvoie `image: null` tant qu'aucun média n'est associé au parcours
 * (ou qu'il a été supprimé). Chaque écran improvisait alors son propre vide —
 * carré gris, icône grisée, ou rien du tout, ce qui donnait une image cassée.
 * Un seul asset, résolu ici, rend les listes homogènes.
 *
 * L'illustration est volontairement cadrée large, glyphe centré : la même URL
 * sert de couverture 16:9 et de vignette carrée, où `object-cover` ne garde que
 * le centre.
 */
export const DEFAULT_LEARNING_PATH_COVER = '/assets/learning-path-cover.svg';

/**
 * Retourne l'URL de couverture à afficher, ou l'illustration par défaut.
 *
 * Une chaîne vide ou blanche est traitée comme une absence : elle produirait une
 * requête vers la page courante et une image cassée.
 */
export function learningPathCover(url?: string | null): string {
  return url?.trim() ? url : DEFAULT_LEARNING_PATH_COVER;
}
