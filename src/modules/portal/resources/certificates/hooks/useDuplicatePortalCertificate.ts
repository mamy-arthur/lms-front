import { makeDuplicateMutation } from '@modules/shared/hooks/resourceMutations';
import { portalCertificatesApi } from '../api';
import { PORTAL_CERTIFICATES_QUERY_KEY } from './usePortalCertificatesQuery';

export const useDuplicatePortalCertificate = makeDuplicateMutation(
  portalCertificatesApi,
  PORTAL_CERTIFICATES_QUERY_KEY,
);
