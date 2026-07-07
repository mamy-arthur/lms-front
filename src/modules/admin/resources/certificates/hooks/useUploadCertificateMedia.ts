import { useMutation } from '@tanstack/react-query';
import { adminCertificatesApi } from '../api';

export function useUploadCertificateMedia() {
  return useMutation({
    mutationFn: (file: File) => adminCertificatesApi.uploadMedia(file),
  });
}
