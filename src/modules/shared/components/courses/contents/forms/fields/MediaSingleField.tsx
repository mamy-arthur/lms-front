'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Trash } from 'lucide-react';
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
  onPendingDelete?: (id: string) => void;
}

export function MediaSingleField({
  field,
  value,
  onChange,
  contentTypeId,
  onPendingDelete,
}: MediaSingleFieldProps) {
  const [mediaInfo, setMediaInfo] = useState<ApiMedia | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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
    setUploadProgress(0);
    setUploadError(null);
    try {
      if (mediaInfo) {
        await mediaApi.delete(mediaInfo.id);
        setMediaInfo(null);
        onChange(null); // clear value immediately so a failed upload doesn't leave a stale UUID
      }
      const res = await mediaApi.uploadWithProgress(
        file,
        contentTypeId,
        field.field_id,
        setUploadProgress,
      );
      setMediaInfo(res.data);
      onChange(res.data.id);
    } catch (err) {
      setUploadError(extractErrorMessage(err));
    } finally {
      setUploadProgress(null);
    }
  };

  const handleRemove = () => {
    if (mediaInfo) onPendingDelete?.(mediaInfo.id);
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
          className="relative flex flex-col gap-3 w-75 rounded-sm  bg-card  cursor-pointer transition-colors"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Supprimer"
            className="z-50 absolute top-1.5 right-1.5 size-5 rounded-full bg-black/50 text-white hover:bg-destructive hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
          >
            <Trash className="size-2.5" />
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

      {uploadProgress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              Upload en cours…
            </span>
            <span className="font-semibold text-(--color-primary)">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-(--color-primary) transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
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
