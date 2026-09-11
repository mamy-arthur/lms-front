/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { GripVertical, Loader2, Plus, Save, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensors,
  useSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { MutationLike } from '@/shared/types/mutation';
import { extractApiError } from '@/shared/utils/api-error';
import { CompetencyCategorySelect } from '../../components/categories/CompetencyCategorySelect';
import { SelectCoursesDialog } from './SelectCoursesDialog';
import type { Course } from '@/modules/shared/components/courses/types';

export interface ModuleFormProps {
  form: UseFormReturn<any>;
  mutation: MutationLike;
  isEdit: boolean;
  handleClose: () => void;
  onSubmit: (values: any) => void;
  selectedCourseIds: string[];
  toggleCourse: (courseId: string) => void;
  addCourses: (courses: Course[]) => void;
  selectedCourses: Course[];
}

function SortableCourseItem({
  courseId,
  fullName,
  categoryName,
  index,
  onRemove,
}: {
  courseId: string;
  fullName: string;
  categoryName?: string;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: courseId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1.5 text-xs',
        isDragging && 'z-10 opacity-50 shadow-md',
      )}
    >
      <button
        type="button"
        className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <span className="flex size-4 shrink-0 items-center justify-center rounded bg-muted-foreground/10 text-center text-[10px] font-medium text-muted-foreground">
        {index + 1}
      </span>
      <span className="flex-1 truncate">{fullName}</span>
      {categoryName && <span className="shrink-0 text-muted-foreground">{categoryName}</span>}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 inline-flex items-center justify-center rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        aria-label={`Retirer ${fullName}`}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

export function ModuleForm({
  form,
  mutation,
  isEdit,
  handleClose,
  onSubmit,
  selectedCourseIds,
  toggleCourse,
  addCourses,
  selectedCourses,
}: ModuleFormProps) {
  const [coursesDialogOpen, setCoursesDialogOpen] = useState(false);

  const courseMap = useMemo(() => {
    const map = new Map<string, { fullName: string; categoryName: string }>();
    for (const course of selectedCourses) {
      map.set(course.id, { fullName: course.fullName, categoryName: course.categoryName ?? '' });
    }
    return map;
  }, [selectedCourses]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = selectedCourseIds.indexOf(String(active.id));
      const newIndex = selectedCourseIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      form.setValue('courseIds', arrayMove(selectedCourseIds, oldIndex, newIndex), {
        shouldValidate: true,
      });
    },
    [selectedCourseIds, form],
  );

  return (
    <Field {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col min-h-0"
        noValidate
      >
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
          {mutation.isError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {extractApiError(mutation.error, isEdit)}
            </div>
          )}

          <FieldRoot
            control={form.control}
            name="shortname"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Nom</FieldLabel>
                <FieldContent>
                  <Input autoFocus aria-label="Nom" className="text-xs" {...field} />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Catégorie</FieldLabel>
                <CompetencyCategorySelect value={field.value ?? ''} onChange={field.onChange} />
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="description"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Description</FieldLabel>
                <FieldContent>
                  <Textarea
                    className="min-h-24 resize-none text-xs"
                    placeholder="Décrivez le module…"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FieldContent>
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="courseIds"
            render={() => (
              <FieldGroup>
                <div className="flex items-center justify-between">
                  <FieldLabel className="text-xs">
                    Cours dans ce module
                    {selectedCourseIds.length > 0 && (
                      <span className="ml-1.5 text-muted-foreground">
                        ({selectedCourseIds.length})
                      </span>
                    )}
                  </FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="h-6 gap-1 text-xs"
                    onClick={() => setCoursesDialogOpen(true)}
                  >
                    <Plus className="size-3" />
                    Ajouter un cours
                  </Button>
                </div>

                {selectedCourseIds.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedCourseIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="mt-1 space-y-1">
                        {selectedCourseIds.map((courseId, index) => {
                          const info = courseMap.get(courseId);
                          return (
                            <SortableCourseItem
                              key={courseId}
                              courseId={courseId}
                              fullName={info?.fullName ?? courseId}
                              categoryName={info?.categoryName}
                              index={index}
                              onRemove={() => toggleCourse(courseId)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <p className="text-xs text-muted-foreground">Aucun cours lié.</p>
                )}

                <FieldError />
              </FieldGroup>
            )}
          />
        </div>

        <SelectCoursesDialog
          open={coursesDialogOpen}
          onOpenChange={setCoursesDialogOpen}
          selectedCourseIds={selectedCourseIds}
          onConfirm={addCourses}
        />

        <div className="flex shrink-0 flex-col-reverse items-stretch gap-2 border-t bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            size="lg"
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            size="lg"
            className="w-full bg-(--color-primary) hover:bg-(--color-primary)/80 sm:w-auto"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </form>
    </Field>
  );
}
