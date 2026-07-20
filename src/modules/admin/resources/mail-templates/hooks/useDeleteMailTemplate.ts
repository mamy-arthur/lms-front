import { makeDeleteMutation } from '@modules/shared/hooks/resourceMutations';
import { adminMailTemplatesApi } from '../api';
import { ADMIN_MAIL_TEMPLATES_QUERY_KEY } from './useMailTemplatesQuery';

export const useDeleteMailTemplate = makeDeleteMutation(
  adminMailTemplatesApi,
  ADMIN_MAIL_TEMPLATES_QUERY_KEY,
);
