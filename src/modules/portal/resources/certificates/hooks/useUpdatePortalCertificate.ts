import { makeUpdateMutation } from '@modules/shared/hooks/resourceMutations';
import { portalCertificatesApi } from '../api';
import type { UpdateCertificatePayload } from '../types';
import { PORTAL_CERTIFICATES_QUERY_KEY } from './usePortalCertificatesQuery';

export const useUpdatePortalCertificate = makeUpdateMutation<UpdateCertificatePayload>(
  portalCertificatesApi,
  PORTAL_CERTIFICATES_QUERY_KEY,
);
