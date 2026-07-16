import { useMutation } from '@tanstack/react-query';
import { adminMailTemplatesApi } from '../api';

export function useUploadMailTemplateMedia() {
  return useMutation({
    mutationFn: (file: File) => adminMailTemplatesApi.uploadMedia(file),
  });
}
