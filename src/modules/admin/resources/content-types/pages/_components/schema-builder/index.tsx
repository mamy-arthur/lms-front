'use client';

import { type Control, useFieldArray } from 'react-hook-form';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Plus, Layers } from 'lucide-react';
import type { ContentTypeFormValues } from '../../../validation';
import { FieldCard } from './field-card';

// ─── Props ───────────────────────────────────────────────────────────────────

interface SchemaBuilderProps {
  control: Control<ContentTypeFormValues>;
  /**
   * IDs (from the backend) of fields that existed before the form was opened.
   * Used to determine whether a field is "new" or pre-existing.
   */
  existingFieldCount?: number;
}

const DEFAULT_NEW_FIELD = {
  _isNew: true as const,
  type: 'text' as const,
  name: '',
  label: '',
  required: false,
  is_archived: false,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function SchemaBuilder({ control, existingFieldCount = 0 }: SchemaBuilderProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
    keyName: '_rhfId',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f._rhfId === active.id);
    const newIndex = fields.findIndex((f) => f._rhfId === over.id);
    if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex);
  };

  const fieldCount = fields.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Schéma des champs</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fieldCount === 0
              ? 'Aucun champ défini'
              : `${fieldCount} champ${fieldCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...DEFAULT_NEW_FIELD })}
        >
          <Plus className="size-4" />
          Ajouter un champ
        </Button>
      </div>

      {/* Field list */}
      {fieldCount > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f._rhfId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fields.map((field, index) => (
                <FieldCard
                  key={field._rhfId}
                  id={field._rhfId}
                  index={index}
                  control={control}
                  isNew={field._isNew ?? index >= existingFieldCount}
                  onRemove={() => remove(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-14 text-center">
          <div className="mb-3 rounded-full bg-muted p-3">
            <Layers className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Aucun champ pour l&apos;instant</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Cliquez sur « Ajouter un champ » pour construire le schéma de ce content type.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => append({ ...DEFAULT_NEW_FIELD })}
          >
            <Plus className="size-4" />
            Ajouter un champ
          </Button>
        </div>
      )}
    </div>
  );
}
