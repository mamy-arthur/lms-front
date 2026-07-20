import { makeCreateMutation } from '@modules/shared/hooks/resourceMutations';
import { portalCertificatesApi } from '../api';
import type { CreateCertificatePayload } from '../types';
import { PORTAL_CERTIFICATES_QUERY_KEY } from './usePortalCertificatesQuery';

export const useCreatePortalCertificate = makeCreateMutation<CreateCertificatePayload>(
  portalCertificatesApi,
  PORTAL_CERTIFICATES_QUERY_KEY,
);
