import { makeUpdateMutation } from '@modules/shared/hooks/resourceMutations';
import { adminMailTemplatesApi } from '../api';
import type { UpdateMailTemplatePayload } from '../types';
import { ADMIN_MAIL_TEMPLATES_QUERY_KEY } from './useMailTemplatesQuery';

export const useUpdateMailTemplate = makeUpdateMutation<UpdateMailTemplatePayload>(
  adminMailTemplatesApi,
  ADMIN_MAIL_TEMPLATES_QUERY_KEY,
);
