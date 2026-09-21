'use client';

import { useState, useRef } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MainBlock } from './SharedBlocks';
import { DynamicField } from './DynamicField';
import { ScormPackageField, type ScormPackageFieldState } from './fields/ScormPackageField';
import { extractMediaId } from './fields/media-utils';
import { useDeleteMediaBatch } from '@/shared/hooks/useMedia';
import { buildContentSchema } from './content-schema';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

interface DynamicContentFormProps {
  contentType: ContentTypeResource;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** Si la publication est choisie, attendre un package exploitable avant l'enregistrement. */
  requireReadyScorm?: boolean;
  /** Package déjà attaché à l'entrée (édition), absent pour une entrée pas encore créée. */
  attachedScormPackageId?: string | null;
  /** Notifié en continu (upload + statut temps réel) pour le rattachement au clic Enregistrer
   *  et le gating de la publication côté parent. */
  onScormStateChange?: (state: ScormPackageFieldState) => void;
}

export function DynamicContentForm({
  contentType,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  requireReadyScorm = false,
  attachedScormPackageId,
  onScormStateChange,
}: DynamicContentFormProps) {
  const activeFields = contentType.fields.filter((f) => !f.is_archived);
  const isScorm = contentType.module_type === 'scorm';

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
  // IDs of removed media files — deleted server-side only on form submit
  const pendingDeleteIds = useRef<string[]>([]);
  const deleteMediaBatch = useDeleteMediaBatch();

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [scormState, setScormState] = useState<ScormPackageFieldState>({
    packageId: attachedScormPackageId ?? null,
    status: null,
  });
  const [showScormRequiredError, setShowScormRequiredError] = useState(false);
  const scormPackageMissing = isScorm && !scormState.packageId;
  const scormNotReady = isScorm && requireReadyScorm && scormState.status !== 'ready';

  const handleScormStateChange = (state: ScormPackageFieldState) => {
    setScormState(state);
    if (state.packageId) setShowScormRequiredError(false);
    onScormStateChange?.(state);
  };

  const handleFieldChange = (name: string, val: unknown) => {
    setFieldValues((prev) => ({ ...prev, [name]: val }));
    if (fieldErrors[name])
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scormPackageMissing) {
      setShowScormRequiredError(true);
      return;
    }
    if (isSubmitting || scormNotReady) return;
    const schema = buildContentSchema(activeFields);
    const result = schema.safeParse(fieldValues);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (key && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    if (pendingDeleteIds.current.length) {
      // Also evicts each id from the media cache, so a deleted file can never be
      // served back from it on a later mount.
      await deleteMediaBatch(pendingDeleteIds.current);
      pendingDeleteIds.current = [];
    }
    onSubmit(result.data as Record<string, unknown>);
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
              onPendingDelete={(id) => {
                pendingDeleteIds.current.push(id);
              }}
            />
            {fieldErrors[field.name] && (
              <p className="text-xs text-destructive">{fieldErrors[field.name]}</p>
            )}
          </div>
        ))}
      </MainBlock>
      {isScorm && (
        <ScormPackageField
          attachedPackageId={attachedScormPackageId ?? null}
          onStateChange={handleScormStateChange}
        />
      )}
      {showScormRequiredError && (
        <p className="text-xs text-destructive">
          Un package SCORM doit être uploadé avant de pouvoir enregistrer.
        </p>
      )}
      {scormNotReady && !scormPackageMissing && (
        <p className="text-xs text-muted-foreground" role="status">
          Le package SCORM doit être prêt avant de pouvoir enregistrer et publier.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || scormNotReady}
          className="bg-(--color-primary) hover:bg-(--color-primary)/80"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="size-3" />
          )}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
