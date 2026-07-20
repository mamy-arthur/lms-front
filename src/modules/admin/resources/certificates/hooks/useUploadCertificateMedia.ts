import { makeUploadMediaMutation } from '@modules/shared/hooks/resourceMutations';
import { adminCertificatesApi } from '../api';

export const useUploadCertificateMedia = makeUploadMediaMutation(adminCertificatesApi);
