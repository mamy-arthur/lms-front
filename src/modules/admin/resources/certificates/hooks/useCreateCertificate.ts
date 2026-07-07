import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCertificatesApi } from '../api';
import type { CreateCertificatePayload } from '../types';
import { ADMIN_CERTIFICATES_QUERY_KEY } from './useCertificatesQuery';

export function useCreateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCertificatePayload) => adminCertificatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CERTIFICATES_QUERY_KEY });
    },
  });
}
