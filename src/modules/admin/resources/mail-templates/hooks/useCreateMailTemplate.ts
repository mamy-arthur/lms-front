import { makeCreateMutation } from '@modules/shared/hooks/resourceMutations';
import { adminMailTemplatesApi } from '../api';
import type { CreateMailTemplatePayload } from '../types';
import { ADMIN_MAIL_TEMPLATES_QUERY_KEY } from './useMailTemplatesQuery';

export const useCreateMailTemplate = makeCreateMutation<CreateMailTemplatePayload>(
  adminMailTemplatesApi,
  ADMIN_MAIL_TEMPLATES_QUERY_KEY,
);
