import { makeDeleteMutation } from '@modules/shared/hooks/resourceMutations';
import { adminCertificatesApi } from '../api';
import { ADMIN_CERTIFICATES_QUERY_KEY } from './useCertificatesQuery';

export const useDeleteCertificate = makeDeleteMutation(
  adminCertificatesApi,
  ADMIN_CERTIFICATES_QUERY_KEY,
);
