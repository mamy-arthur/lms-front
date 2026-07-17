'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { FileUploadField } from '@/modules/shared/components/input-upload/FileUploadField';
import { mediaApi, type ApiMedia } from '@/shared/api/media.api';
import type { ContentTypeField } from '@/shared/types/content-type.types';
import { extractMediaId, extractErrorMessage } from './media-utils';

interface MediaSingleFieldProps {
  field: ContentTypeField;
  value: unknown;
  onChange: (val: unknown) => void;
  contentTypeId: string;
}

export function MediaSingleField({ field, value, onChange, contentTypeId }: MediaSingleFieldProps) {
  const [mediaInfo, setMediaInfo] = useState<ApiMedia | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const id = extractMediaId(value);
    if (!id) return;
    setIsLoadingMedia(true);
    mediaApi
      .get(id)
      .then((r) => setMediaInfo(r.data))
      .catch(() => {})
      .finally(() => setIsLoadingMedia(false));
  }, []);

  const uploadSingle = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      if (mediaInfo) {
        await mediaApi.delete(mediaInfo.id);
        setMediaInfo(null);
      }
      const res = await mediaApi.upload(file, contentTypeId, field.field_id);
      setMediaInfo(res.data);
      onChange(res.data.id);
    } catch (err) {
      setUploadError(extractErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {isLoadingMedia && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Chargement…
        </p>
      )}
      <FileUploadField
        fileName={mediaInfo?.original_name}
        accept={field.accept.join(',')}
        hint={field.accept.join(', ')}
        onFileSelect={uploadSingle}
        onRemove={() => {
          if (mediaInfo) mediaApi.delete(mediaInfo.id).catch(() => {});
          setMediaInfo(null);
          onChange(null);
        }}
      />
      {isUploading && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Upload en cours…
        </p>
      )}
      {uploadError && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" /> {uploadError}
        </p>
      )}
    </div>
  );
}
