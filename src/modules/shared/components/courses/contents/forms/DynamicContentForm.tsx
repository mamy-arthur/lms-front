'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MainBlock } from './SharedBlocks';
import { DynamicField } from './DynamicField';
import { extractMediaId } from './fields/media-utils';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

interface DynamicContentFormProps {
  contentType: ContentTypeResource;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
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
        <Button type="submit" disabled={isSubmitting} className='bg-(--color-primary) hover:bg-(--color-primary)/80'>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
