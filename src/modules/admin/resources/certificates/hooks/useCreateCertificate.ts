import { makeCreateMutation } from '@modules/shared/hooks/resourceMutations';
import { adminCertificatesApi } from '../api';
import type { CreateCertificatePayload } from '../types';
import { ADMIN_CERTIFICATES_QUERY_KEY } from './useCertificatesQuery';

export const useCreateCertificate = makeCreateMutation<CreateCertificatePayload>(
  adminCertificatesApi,
  ADMIN_CERTIFICATES_QUERY_KEY,
  { success: 'Attestation créée', error: 'Échec de la création de l’attestation' },
);
