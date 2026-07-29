import { makeDeleteMutation } from '@modules/shared/hooks/resourceMutations';
import { portalCertificatesApi } from '../api';
import { PORTAL_CERTIFICATES_QUERY_KEY } from './usePortalCertificatesQuery';

export const useDeletePortalCertificate = makeDeleteMutation(
  portalCertificatesApi,
  PORTAL_CERTIFICATES_QUERY_KEY,
  { success: 'Attestation supprimée', error: 'Échec de la suppression de l’attestation' },
);
