'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadField } from '@/modules/shared/components/input-upload/FileUploadField';
import { mediaApi, type ApiMedia } from '@/shared/api/media.api';
import type { ContentTypeField } from '@/shared/types/content-type.types';
import {
  extractMediaId,
  extractErrorMessage,
  isPreviewable,
  downloadFile,
  formatFileSize,
} from './media-utils';
import { MediaThumbnail } from './MediaThumbnail';
import { MediaPreviewModal } from './MediaPreviewModal';

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
  const [previewMedia, setPreviewMedia] = useState<ApiMedia | null>(null);

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

  const handleCardClick = (media: ApiMedia) => {
    if (isPreviewable(media.mime_type)) {
      setPreviewMedia(media);
    } else {
      downloadFile(media.url, media.original_name);
    }
  };

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

  const handleRemove = () => {
    if (mediaInfo) mediaApi.delete(mediaInfo.id).catch(() => {});
    setMediaInfo(null);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {isLoadingMedia && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Chargement…
        </p>
      )}

      {mediaInfo ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick(mediaInfo)}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick(mediaInfo)}
          className="relative flex items-center gap-3 w-fit rounded-lg border border-border bg-card shadow-sm cursor-pointer hover:bg-accent/50 transition-colors p-2"
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="z-50 absolute top-2 right-2 h-3 w-3 text-black p-1"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
          >
            <X className="h-2 w-2" />
          </Button>

          <MediaThumbnail media={mediaInfo} />

          <div className="flex-1 min-w-0 pr-7">
            <span className="block truncate text-xs font-medium">{mediaInfo.original_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(mediaInfo.size_bytes)}
            </span>
          </div>
        </div>
      ) : (
        <FileUploadField
          fileName={undefined}
          accept={field.accept.join(',')}
          hint={field.accept.join(', ')}
          onFileSelect={uploadSingle}
          onRemove={() => {}}
        />
      )}

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

      <MediaPreviewModal media={previewMedia} onClose={() => setPreviewMedia(null)} />
    </div>
  );
}
