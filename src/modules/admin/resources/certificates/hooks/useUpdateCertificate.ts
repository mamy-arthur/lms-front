import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCertificatesApi } from '../api';
import type { UpdateCertificatePayload } from '../types';
import { ADMIN_CERTIFICATES_QUERY_KEY } from './useCertificatesQuery';

export function useUpdateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCertificatePayload }) =>
      adminCertificatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CERTIFICATES_QUERY_KEY });
    },
  });
}
