import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contentTypeApi } from '../api';
import { CONTENT_TYPES_KEY } from './useContentTypesQuery';

export const useCreateContentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contentTypeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_TYPES_KEY });
    },
  });
};
