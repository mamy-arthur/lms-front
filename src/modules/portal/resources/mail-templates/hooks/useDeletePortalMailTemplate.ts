import { makeDeleteMutation } from '@modules/shared/hooks/resourceMutations';
import { portalMailTemplatesApi } from '../api';
import { PORTAL_MAIL_TEMPLATES_QUERY_KEY } from './usePortalMailTemplatesQuery';

export const useDeletePortalMailTemplate = makeDeleteMutation(
  portalMailTemplatesApi,
  PORTAL_MAIL_TEMPLATES_QUERY_KEY,
  { success: 'Template supprimé', error: 'Échec de la suppression du template' },
);
