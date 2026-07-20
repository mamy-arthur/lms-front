import { makeUploadMediaMutation } from '@modules/shared/hooks/resourceMutations';
import { portalCertificatesApi } from '../api';

export const useUploadPortalCertificateMedia = makeUploadMediaMutation(portalCertificatesApi);
