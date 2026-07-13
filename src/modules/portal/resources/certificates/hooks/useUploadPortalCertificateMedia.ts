import { useMutation } from '@tanstack/react-query';
import { portalCertificatesApi } from '../api';

export function useUploadPortalCertificateMedia() {
  return useMutation({
    mutationFn: (file: File) => portalCertificatesApi.uploadMedia(file),
  });
}
