import { useMutation } from '@tanstack/react-query';
import { learningPathsApi } from '../api';

export function useUploadLearningPathMedia() {
  return useMutation({
    mutationFn: (file: File) => learningPathsApi.uploadMedia(file),
  });
}
