'use client';

import { type Control, useWatch } from 'react-hook-form';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FIELD_TYPES, type FieldType } from '../../../types';
import type { ContentTypeFormValues } from '../../../validation';
import { FieldTypeSelect } from './field-type-select';
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

  const fieldType = useWatch({ control, name: `fields.${index}.type` }) as FieldType;
  const fieldName = useWatch({ control, name: `fields.${index}.name` });
  const fieldLabel = useWatch({ control, name: `fields.${index}.label` });
  const isArchived = useWatch({ control, name: `fields.${index}.is_archived` }) ?? false;

  const fieldTypeLabel = FIELD_TYPES.find((ft) => ft.value === fieldType)?.label ?? fieldType;

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
      <Collapsible>
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

          {/* Type badge */}
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
              FIELD_TYPE_COLORS[fieldType] ?? 'bg-muted text-muted-foreground',
            )}
          >
            {fieldTypeLabel}
          </span>

          {/* Name / label summary */}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium leading-snug">
              {fieldLabel || (
                <span className="italic text-muted-foreground">Sans label</span>
              )}
            </p>
            {fieldName && (
              <p className="truncate font-mono text-xs text-muted-foreground leading-snug">
                {fieldName}
              </p>
            )}
          </div>

          {isArchived && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Archivé
            </Badge>
          )}

          {/* Archive / delete action */}
          <FormField
            control={control}
            name={`fields.${index}.is_archived`}
            render={({ field }) => (
              <FieldActions
                isNew={isNew}
                isArchived={isArchived}
                onRemove={onRemove}
                onToggleArchive={() => field.onChange(!field.value)}
              />
            )}
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
              <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* ── Expanded body ──────────────────────────────────────────────── */}
        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-4 space-y-4">
            {/* Field type */}
            <FormField
              control={control}
              name={`fields.${index}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de champ</FormLabel>
                  <FormControl>
                    <FieldTypeSelect
                      value={field.value as FieldType}
                      onChange={field.onChange}
                      disabled={!isNew}
                    />
                  </FormControl>
                  {!isNew && (
                    <p className="text-xs text-muted-foreground">
                      Le type ne peut pas être modifié sur un champ existant.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Name */}
              <FormField
                control={control}
                name={`fields.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom (snake_case)</FormLabel>
                    <FormControl>
                      <Input placeholder="mon_champ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Label */}
              <FormField
                control={control}
                name={`fields.${index}.label`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Mon champ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Required */}
            <FormField
              control={control}
              name={`fields.${index}.required`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      id={`field-required-${index}`}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel
                    htmlFor={`field-required-${index}`}
                    className="font-normal cursor-pointer"
                  >
                    Champ obligatoire
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Media-specific options */}
            {fieldType === 'media' && <MediaOptions index={index} control={control} />}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
