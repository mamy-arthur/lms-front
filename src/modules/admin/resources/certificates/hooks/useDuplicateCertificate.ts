import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCertificatesApi } from '../api';
import { ADMIN_CERTIFICATES_QUERY_KEY } from './useCertificatesQuery';

export function useDuplicateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminCertificatesApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CERTIFICATES_QUERY_KEY });
    },
  });
}
