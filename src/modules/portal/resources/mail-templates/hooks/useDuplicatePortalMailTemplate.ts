import { makeDuplicateMutation } from '@modules/shared/hooks/resourceMutations';
import { portalMailTemplatesApi } from '../api';
import { PORTAL_MAIL_TEMPLATES_QUERY_KEY } from './usePortalMailTemplatesQuery';

export const useDuplicatePortalMailTemplate = makeDuplicateMutation(
  portalMailTemplatesApi,
  PORTAL_MAIL_TEMPLATES_QUERY_KEY,
);
