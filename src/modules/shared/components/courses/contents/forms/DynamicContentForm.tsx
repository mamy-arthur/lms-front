'use client';

import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/modules/shared/components/tiptap/RichTextEditor';
import { FileUploadField } from '@/modules/shared/components/input-upload/FileUploadField';
import { MultiFileUploadField } from '@/modules/shared/components/input-upload/MultiFileUploadField';
import { MainBlock } from './SharedBlocks';
import { mediaApi } from '@/shared/api/media.api';
import type { ContentTypeResource, ContentTypeField } from '@/shared/types/content-type.types';

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
  const [files, setFiles] = useState<File[]>([]);
  // key = `${name}-${size}`, value = media id
  const [uploadedIds, setUploadedIds] = useState<Map<string, string>>(new Map());
  const [singleFileName, setSingleFileName] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileKey = (f: File) => `${f.name}-${f.size}`;

  const extractMessage = (err: unknown): string => {
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      if (typeof e.json === 'object' && e.json !== null) {
        const j = e.json as Record<string, unknown>;
        if (typeof j.message === 'string') return j.message;
      }
      if (typeof e.message === 'string') return e.message;
    }
    return 'Échec de l\'upload';
  };

  const uploadSingle = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await mediaApi.upload(file, contentTypeId, field.field_id);
      setSingleFileName(file.name);
      onChange(res.data.id);
    } catch (err) {
      setUploadError(extractMessage(err));
      setSingleFileName(undefined);
      onChange(null);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultiple = async (nextFiles: File[]) => {
    // Only upload files not already uploaded
    const toUpload = nextFiles.filter((f) => !uploadedIds.has(fileKey(f)));
    if (toUpload.length === 0) {
      // Files were only removed — recompute ids from remaining files
      const remaining = new Map(
        nextFiles
          .filter((f) => uploadedIds.has(fileKey(f)))
          .map((f) => [fileKey(f), uploadedIds.get(fileKey(f))!]),
      );
      setFiles(nextFiles);
      setUploadedIds(remaining);
      onChange([...remaining.values()]);
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const results = await Promise.all(
        toUpload.map((f) => mediaApi.upload(f, contentTypeId, field.field_id)),
      );
      const updated = new Map(uploadedIds);
      toUpload.forEach((f, i) => updated.set(fileKey(f), results[i].data.id));
      // Build ids preserving order of nextFiles
      const ids = nextFiles
        .filter((f) => updated.has(fileKey(f)))
        .map((f) => updated.get(fileKey(f))!);
      setFiles(nextFiles);
      setUploadedIds(updated);
      onChange(ids);
    } catch (err) {
      setUploadError(extractMessage(err));
    } finally {
      setIsUploading(false);
    }
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
            <MultiFileUploadField
              files={files}
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
          <FileUploadField
            fileName={singleFileName}
            accept={field.accept.join(',')}
            hint={field.accept.join(', ')}
            onFileSelect={uploadSingle}
            onRemove={() => {
              setSingleFileName(undefined);
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

export function DynamicContentForm({ contentType, initialData, onSubmit, onCancel, isSubmitting = false }: DynamicContentFormProps) {
  const activeFields = contentType.fields.filter((f) => !f.is_archived);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      activeFields.map((f) => [f.name, initialData?.[f.name] ?? '']),
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
