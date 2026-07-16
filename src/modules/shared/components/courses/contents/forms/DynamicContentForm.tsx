'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/modules/shared/components/tiptap/RichTextEditor';
import { FileUploadField } from '@/modules/shared/components/input-upload/FileUploadField';
import { MultiFileUploadField } from '@/modules/shared/components/input-upload/MultiFileUploadField';
import { MainBlock } from './SharedBlocks';
import type { ContentTypeResource, ContentTypeField } from '@/shared/types/content-type.types';

interface DynamicContentFormProps {
  contentType: ContentTypeResource;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: ContentTypeField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [singleFile, setSingleFile] = useState<string | undefined>(undefined);

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
          <MultiFileUploadField
            files={files}
            accept={field.accept.join(',')}
            hint={field.accept.join(', ')}
            onFilesChange={(newFiles) => {
              setFiles(newFiles);
              onChange(newFiles.map((f) => f.name));
            }}
          />
        );
      }
      return (
        <FileUploadField
          fileName={singleFile}
          accept={field.accept.join(',')}
          hint={field.accept.join(', ')}
          onFileSelect={(file) => {
            setSingleFile(file.name);
            onChange(file.name);
          }}
          onRemove={() => {
            setSingleFile(undefined);
            onChange(null);
          }}
        />
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

export function DynamicContentForm({ contentType, onSubmit, onCancel }: DynamicContentFormProps) {
  const activeFields = contentType.fields.filter((f) => !f.is_archived);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(activeFields.map((f) => [f.name, ''])),
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
            />
          </div>
        ))}
      </MainBlock>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}
