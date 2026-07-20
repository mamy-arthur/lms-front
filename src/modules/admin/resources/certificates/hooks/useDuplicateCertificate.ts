import { makeDuplicateMutation } from '@modules/shared/hooks/resourceMutations';
import { adminCertificatesApi } from '../api';
import { ADMIN_CERTIFICATES_QUERY_KEY } from './useCertificatesQuery';

export const useDuplicateCertificate = makeDuplicateMutation(
  adminCertificatesApi,
  ADMIN_CERTIFICATES_QUERY_KEY,
);
