import { makeUpdateMutation } from '@modules/shared/hooks/resourceMutations';
import { adminCertificatesApi } from '../api';
import type { UpdateCertificatePayload } from '../types';
import { ADMIN_CERTIFICATES_QUERY_KEY } from './useCertificatesQuery';

export const useUpdateCertificate = makeUpdateMutation<UpdateCertificatePayload>(
  adminCertificatesApi,
  ADMIN_CERTIFICATES_QUERY_KEY,
);
