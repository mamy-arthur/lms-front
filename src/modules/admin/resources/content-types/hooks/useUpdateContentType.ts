import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contentTypeApi } from '../api';
import { CONTENT_TYPES_KEY } from './useContentTypesQuery';
import type { UpdateContentTypePayload } from '../types';

export const useUpdateContentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContentTypePayload }) =>
      contentTypeApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CONTENT_TYPES_KEY });
      queryClient.invalidateQueries({ queryKey: ['content-types', id] });
    },
  });
};
