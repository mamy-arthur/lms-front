import { makeDuplicateMutation } from '@modules/shared/hooks/resourceMutations';
import { adminMailTemplatesApi } from '../api';
import { ADMIN_MAIL_TEMPLATES_QUERY_KEY } from './useMailTemplatesQuery';

export const useDuplicateMailTemplate = makeDuplicateMutation(
  adminMailTemplatesApi,
  ADMIN_MAIL_TEMPLATES_QUERY_KEY,
);
