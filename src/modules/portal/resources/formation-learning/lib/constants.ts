import type { ContentType } from './types';

/** Affiché par l'appelant quand `useExecutionConflictRecovery` a repris la main. */
export const EXECUTION_CONFLICT_MESSAGE =
  'Votre parcours a changé entre-temps. L’état a été actualisé.';

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  folder: 'Dossier',
  file: 'Fichier',
  page: 'Page',
  scorm: 'SCORM',
  survey: 'Sondage',
  url: 'URL',
  'text-media': 'Texte & Média',
};
