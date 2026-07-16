'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, FileArchive, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/modules/shared/components/tiptap/RichTextEditor';
import { FileUploadField } from '@/modules/shared/components/input-upload/FileUploadField';
import { MultiFileUploadField } from '@/modules/shared/components/input-upload/MultiFileUploadField';
import { MainBlock } from './SharedBlocks';
import { mediaApi, type ApiMedia } from '@/shared/api/media.api';
import type { ContentTypeResource, ContentTypeField } from '@/shared/types/content-type.types';

// The backend stores media IDs as plain strings but expands them to
// { id, url, mime_type } objects on read. These two helpers let us work with
// both shapes so we always submit plain UUID strings to the SchemaValidator.
function isMediaObject(v: unknown): v is { id: string } {
  return !!v && typeof v === 'object' && 'id' in v;
}
function extractMediaId(v: unknown): string | null {
  if (typeof v === 'string' && v) return v;
  if (isMediaObject(v)) return v.id;
  return null;
}

interface DynamicContentFormProps {
  contentType: ContentTypeResource;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function DynamicField({
  field,
  value,
  onChange,
  contentTypeId,
}: {
  field: ContentTypeField;
  value: unknown;
  onChange: (val: unknown) => void;
  contentTypeId: string;
}) {
  // ── Media display state ───────────────────────────────────────────────────
  // Single file: full ApiMedia so we can show original_name
  const [mediaInfo, setMediaInfo] = useState<ApiMedia | null>(null);
  // Multiple files
  const [mediaList, setMediaList] = useState<ApiMedia[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  // ── Upload states ─────────────────────────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch metadata for already-associated media files on mount (edit mode).
  useEffect(() => {
    if (field.type !== 'media') return;
    if (field.multiple) {
      const ids = (Array.isArray(value) ? value : [])
        .map(extractMediaId)
        .filter((id): id is string => !!id);
      if (!ids.length) return;
      setIsLoadingMedia(true);
      Promise.all(ids.map((id) => mediaApi.get(id)))
        .then((rs) => setMediaList(rs.map((r) => r.data)))
        .catch(() => {})
        .finally(() => setIsLoadingMedia(false));
    } else {
      const id = extractMediaId(value);
      if (!id) return;
      setIsLoadingMedia(true);
      mediaApi
        .get(id)
        .then((r) => setMediaInfo(r.data))
        .catch(() => {})
        .finally(() => setIsLoadingMedia(false));
    }
  }, []);

  const extractMessage = (err: unknown): string => {
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      if (typeof e.json === 'object' && e.json !== null) {
        const j = e.json as Record<string, unknown>;
        if (typeof j.message === 'string') return j.message;
      }
      if (typeof e.message === 'string') return e.message;
    }
    return "Échec de l'upload";
  };

  const uploadSingle = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      // The backend forbids uploading to a single-file field that already has
      // an attachment. Delete the existing media first so the slot is free.
      if (mediaInfo) {
        await mediaApi.delete(mediaInfo.id);
        setMediaInfo(null);
      }
      const res = await mediaApi.upload(file, contentTypeId, field.field_id);
      setMediaInfo(res.data);
      onChange(res.data.id); // SchemaValidator expects a plain UUID string
    } catch (err) {
      setUploadError(extractMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  // MultiFileUploadField receives files=[] so onFilesChange delivers only
  // the *newly* selected files — no re-uploading of already-uploaded ones.
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
      onChange(updated.map((m) => m.id)); // SchemaValidator expects string[]
    } catch (err) {
      setUploadError(extractMessage(err));
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

  switch (field.type) {
    case 'text':
      return (
        <Input
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          required={field.required}
        />
      );

    case 'textarea':
      return (
        <Textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          required={field.required}
        />
      );

    case 'richtext':
      return (
        <RichTextEditor
          value={(value as string) ?? ''}
          onChange={onChange}
          placeholder={field.label}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          placeholder={field.label}
          required={field.required}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={field.field_id}
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <label htmlFor={field.field_id} className="text-sm">
            {field.label}
          </label>
        </div>
      );

    case 'media':
      if (field.multiple) {
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

    case 'select':
    case 'relation':
      // Render as text input for now (requires additional option data from API)
      return (
        <Input
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          required={field.required}
        />
      );

    default:
      return null;
  }
}

export function DynamicContentForm({
  contentType,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DynamicContentFormProps) {
  const activeFields = contentType.fields.filter((f) => !f.is_archived);

  // Normalise media field values from the API's read format { id, url, … }
  // back to plain UUID strings that the SchemaValidator accepts on write.
  const normaliseMediaValue = (f: (typeof activeFields)[number], raw: unknown): unknown => {
    if (f.type !== 'media') return raw ?? '';
    if (f.multiple) {
      return (Array.isArray(raw) ? raw : []).map(extractMediaId).filter(Boolean);
    }
    return extractMediaId(raw) ?? null;
  };

  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      activeFields.map((f) => [f.name, normaliseMediaValue(f, initialData?.[f.name])]),
    ),
  );

  const handleFieldChange = (name: string, val: unknown) => {
    setFieldValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(fieldValues);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <MainBlock>
        {/* Dynamic fields from content type definition */}
        {activeFields.map((field) => (
          <div key={field.field_id} className="space-y-2">
            {field.type !== 'checkbox' && (
              <Label>
                {field.label}
                {field.required && <span className="ml-1 text-destructive">*</span>}
              </Label>
            )}
            <DynamicField
              field={field}
              value={fieldValues[field.name]}
              onChange={(val) => handleFieldChange(field.name, val)}
              contentTypeId={contentType.id}
            />
          </div>
        ))}
      </MainBlock>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
