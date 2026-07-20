import { makeUploadMediaMutation } from '@modules/shared/hooks/resourceMutations';
import { adminMailTemplatesApi } from '../api';

export const useUploadMailTemplateMedia = makeUploadMediaMutation(adminMailTemplatesApi);
