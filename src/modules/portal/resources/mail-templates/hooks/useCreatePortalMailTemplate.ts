import { makeCreateMutation } from '@modules/shared/hooks/resourceMutations';
import { portalMailTemplatesApi } from '../api';
import type { CreateMailTemplatePayload } from '../types';
import { PORTAL_MAIL_TEMPLATES_QUERY_KEY } from './usePortalMailTemplatesQuery';

export const useCreatePortalMailTemplate = makeCreateMutation<CreateMailTemplatePayload>(
  portalMailTemplatesApi,
  PORTAL_MAIL_TEMPLATES_QUERY_KEY,
);
