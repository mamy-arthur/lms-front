import { makeUploadMediaMutation } from '@modules/shared/hooks/resourceMutations';
import { portalMailTemplatesApi } from '../api';

export const useUploadPortalMailTemplateMedia = makeUploadMediaMutation(portalMailTemplatesApi);
