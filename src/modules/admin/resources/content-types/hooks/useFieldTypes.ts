import { useQuery } from '@tanstack/react-query';
import { contentTypeApi } from '../api';

export const useFieldTypes = () =>
  useQuery({
    queryKey: ['field-types'],
    queryFn: contentTypeApi.getFieldTypes,
  });

export const useMediaMimeTypes = () =>
  useQuery({
    queryKey: ['media-mime-types'],
    queryFn: contentTypeApi.getMediaMimeTypes,
  });
