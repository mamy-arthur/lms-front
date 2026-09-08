export { MailTemplatesList } from './pages/MailTemplatesList';
export type { MailTemplate } from './types';

// Réutilisés par d'autres ressources admin (ex: programs) pour créer/sélectionner
// un template mail sans dupliquer les mutations/toasts/invalidations existants.
export { useMailTemplatesQuery } from './hooks/useMailTemplatesQuery';
export { useCreateMailTemplate } from './hooks/useCreateMailTemplate';
export { useUpdateMailTemplate } from './hooks/useUpdateMailTemplate';
export { useUploadMailTemplateMedia } from './hooks/useUploadMailTemplateMedia';
