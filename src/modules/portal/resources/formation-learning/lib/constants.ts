import type { ContentType } from './types';

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  folder: 'Dossier',
  file: 'Fichier',
  page: 'Page',
  scorm: 'SCORM',
  survey: 'Sondage',
  url: 'URL',
  'text-media': 'Texte & Média',
};
