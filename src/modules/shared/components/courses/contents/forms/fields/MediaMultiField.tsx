'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, FileArchive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MultiFileUploadField } from '@/modules/shared/components/input-upload/MultiFileUploadField';
import { mediaApi, type ApiMedia } from '@/shared/api/media.api';
import type { ContentTypeField } from '@/shared/types/content-type.types';
import { extractMediaId, extractErrorMessage } from './media-utils';

interface MediaMultiFieldProps {
  field: ContentTypeField;
  value: unknown;
  onChange: (val: unknown) => void;
  contentTypeId: string;
}

export function MediaMultiField({ field, value, onChange, contentTypeId }: MediaMultiFieldProps) {
  const [mediaList, setMediaList] = useState<ApiMedia[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    setIsUploading(true);
    setUploadError(null);
    try {
      const results = await Promise.all(
        newFiles.map((f) => mediaApi.upload(f, contentTypeId, field.field_id)),
      );
      const updated = [...mediaList, ...results.map((r) => r.data)];
      setMediaList(updated);
      onChange(updated.map((m) => m.id));
    } catch (err) {
      setUploadError(extractErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const removeFromList = (id: string) => {
    mediaApi.delete(id).catch(() => {});
    const updated = mediaList.filter((m) => m.id !== id);
    setMediaList(updated);
    onChange(updated.length ? updated.map((m) => m.id) : null);
  };

  return (
    <div className="space-y-2">
      {isLoadingMedia && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Chargement…
        </p>
      )}
      {mediaList.map((media) => (
        <div
          key={media.id}
          className="flex items-center gap-3 w-full rounded-md border bg-background px-3 py-2"
        >
          <FileArchive className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="truncate text-xs flex-1 text-left">{media.original_name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => removeFromList(media.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <MultiFileUploadField
        files={[]}
        accept={field.accept.join(',')}
        hint={field.accept.join(', ')}
        onFilesChange={uploadMultiple}
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
