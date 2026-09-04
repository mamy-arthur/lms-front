'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MultiFileUploadField } from '@/modules/shared/components/input-upload/MultiFileUploadField';
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

interface MediaMultiFieldProps {
  field: ContentTypeField;
  value: unknown;
  onChange: (val: unknown) => void;
  contentTypeId: string;
  onPendingDelete?: (id: string) => void;
}

export function MediaMultiField({
  field,
  value,
  onChange,
  contentTypeId,
  onPendingDelete,
}: MediaMultiFieldProps) {
  const [mediaList, setMediaList] = useState<ApiMedia[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [uploadProgresses, setUploadProgresses] = useState<{ name: string; pct: number }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<ApiMedia | null>(null);

  const handleItemClick = (media: ApiMedia) => {
    if (isPreviewable(media.mime_type)) {
      setPreviewMedia(media);
    } else {
      downloadFile(media.url, media.original_name);
    }
  };

  useEffect(() => {
    const ids = (Array.isArray(value) ? value : [])
      .map(extractMediaId)
      .filter((id): id is string => !!id);
    if (!ids.length) return;
    setIsLoadingMedia(true);
    Promise.all(ids.map((id) => mediaApi.get(id)))
      .then((rs) => setMediaList(rs.map((r) => r.data)))
      .catch(() => {})
      .finally(() => setIsLoadingMedia(false));
  }, []);

  const uploadMultiple = async (newFiles: File[]) => {
    if (!newFiles.length) return;
    setUploadError(null);
    setUploadProgresses(newFiles.map((f) => ({ name: f.name, pct: 0 })));
    try {
      const results = await Promise.all(
        newFiles.map((f, i) =>
          mediaApi.uploadWithProgress(f, contentTypeId, field.field_id, (pct) => {
            setUploadProgresses((prev) =>
              prev.map((item, j) => (j === i ? { ...item, pct } : item)),
            );
          }),
        ),
      );
      const updated = [...mediaList, ...results.map((r) => r.data)];
      setMediaList(updated);
      onChange(updated.map((m) => m.id));
    } catch (err) {
      setUploadError(extractErrorMessage(err));
    } finally {
      setUploadProgresses([]);
    }
  };

  const removeFromList = (id: string) => {
    onPendingDelete?.(id);
    const updated = mediaList.filter((m) => m.id !== id);
    setMediaList(updated);
    onChange(updated.length ? updated.map((m) => m.id) : null);
  };

  return (
    <div className="space-y-2">
      <MultiFileUploadField
        files={[]}
        accept={field.accept.join(',')}
        hint={field.accept.join(', ')}
        onFilesChange={uploadMultiple}
      />

      {isLoadingMedia && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Chargement…
        </p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {mediaList.map((media) => (
          <div
            key={media.id}
            role="button"
            tabIndex={0}
            onClick={() => handleItemClick(media)}
            onKeyDown={(e) => e.key === 'Enter' && handleItemClick(media)}
            className="relative flex flex-col gap-3 w-full rounded-sm cursor-pointer transition-colors"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Supprimer"
              className="z-50 absolute top-1.5 right-1.5 size-5 rounded-full bg-black/50 text-white hover:bg-destructive hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                removeFromList(media.id);
              }}
            >
              <Trash className="size-2.5" />
            </Button>

            <MediaThumbnail media={media} />

            <div className="flex-1 min-w-0 px-2 py-1">
              <span className="block truncate text-xs">{media.original_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(media.size_bytes)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {uploadProgresses.map(({ name, pct }) => (
        <div key={name} className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 truncate max-w-[70%]">
              <Loader2 className="size-3 shrink-0 animate-spin" />
              {name}
            </span>
            <span className="font-semibold text-(--color-primary)">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-(--color-primary) transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}
      {uploadError && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" /> {uploadError}
        </p>
      )}

      <MediaPreviewModal media={previewMedia} onClose={() => setPreviewMedia(null)} />
    </div>
  );
}
