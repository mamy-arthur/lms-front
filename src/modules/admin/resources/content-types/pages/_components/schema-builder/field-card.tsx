'use client';

import { useState } from 'react';
import { type Control, useController, useFormState } from 'react-hook-form';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FIELD_TYPES, type FieldType } from '../../../types';
import type { ContentTypeFormValues } from '../../../validation';
import { FieldTypePicker } from './field-type-picker';
import { MediaOptions } from './media-options';
import { FieldActions } from './field-actions';

// ─── Type badge colours ──────────────────────────────────────────────────────

const FIELD_TYPE_COLORS: Record<FieldType, string> = {
  text: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  textarea: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  richtext: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  number: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  date: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  select: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  checkbox: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  media: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  relation: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface FieldCardProps {
  /** DnD stable id (RHF-generated). */
  id: string;
  index: number;
  control: Control<ContentTypeFormValues>;
  /** True when the field was added in this session (not yet persisted). */
  isNew: boolean;
  onRemove: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FieldCard({ id, index, control, isNew, onRemove }: FieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const { field: typeField } = useController({ control, name: `fields.${index}.type` });
  const { field: nameField } = useController({ control, name: `fields.${index}.name` });
  const { field: labelField } = useController({ control, name: `fields.${index}.label` });
  const { field: archivedField } = useController({ control, name: `fields.${index}.is_archived` });
  const { field: requiredField } = useController({ control, name: `fields.${index}.required` });
  const { errors } = useFormState({ control });

  const fieldType = typeField.value as FieldType;
  const fieldName = nameField.value as string;
  const fieldLabel = labelField.value as string;
  const isArchived = (archivedField.value ?? false) as boolean;

  const [isOpen, setIsOpen] = useState(false);

  const fieldTypeLabel = FIELD_TYPES.find((ft) => ft.value === fieldType)?.label ?? fieldType;
  const fieldErrors = errors.fields?.[index] as
    Record<string, { message?: string } | undefined> | undefined;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-card transition-shadow',
        isDragging && 'shadow-lg opacity-75 z-10',
        isArchived && 'opacity-60',
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Drag handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
            aria-label="Réordonner"
          >
            <GripVertical className="size-4" />
          </button>

          {/* Name / label summary */}
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium leading-snug">
              {fieldLabel || <span className="text-xs text-muted-foreground">Sans label</span>}
            </p>
            {fieldName && (
              <p className="truncate font-mono text-xs text-muted-foreground leading-snug">
                {fieldName}
              </p>
            )}
          </div>

          {/* Type badge */}
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
              FIELD_TYPE_COLORS[fieldType] ?? 'bg-muted text-muted-foreground',
            )}
          >
            {fieldTypeLabel}
          </span>

          {isArchived && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Archivé
            </Badge>
          )}

          {/* Archive / delete action */}
          <FieldActions
            isNew={isNew}
            isArchived={isArchived}
            onRemove={onRemove}
            onToggleArchive={() => archivedField.onChange(!archivedField.value)}
          />

          {/* Expand toggle */}
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Développer le champ"
            >
              <ChevronDown
                className={cn('size-4 transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* ── Expanded body ──────────────────────────────────────────────── */}
        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-center">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor={`field-name-${index}`}>Nom (snake_case)</Label>
                <Input id={`field-name-${index}`} placeholder="mon_champ" {...nameField} />
                {fieldErrors?.name?.message && (
                  <p className="text-xs text-destructive">{fieldErrors.name.message}</p>
                )}
              </div>

              {/* Label */}
              <div className="space-y-2">
                <Label htmlFor={`field-label-${index}`}>Label</Label>
                <Input id={`field-label-${index}`} placeholder="Mon champ" {...labelField} />
                {fieldErrors?.label?.message && (
                  <p className="text-xs text-destructive">{fieldErrors.label.message}</p>
                )}
              </div>
              {/* Required */}
              <div className="flex items-center gap-2 mt-5">
                <Checkbox
                  id={`field-required-${index}`}
                  checked={requiredField.value as boolean}
                  onCheckedChange={requiredField.onChange}
                />
                <Label htmlFor={`field-required-${index}`} className="font-normal cursor-pointer">
                  Champ obligatoire
                </Label>
              </div>
            </div>
            {/* Field type */}
            <div className="flex flex-col space-y-2">
              <Label>Type de champ</Label>
              <FieldTypePicker
                value={typeField.value as FieldType}
                onChange={(v) => typeField.onChange(v)}
                disabled={!isNew}
              />
              {!isNew && (
                <p className="text-xs text-muted-foreground">
                  Le type ne peut pas être modifié sur un champ existant.
                </p>
              )}
              {fieldErrors?.type?.message && (
                <p className="text-xs text-destructive">{fieldErrors.type.message}</p>
              )}
            </div>
            {/* Media-specific options */}
            {fieldType === 'media' && <MediaOptions index={index} control={control} />}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
