/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Check, ChevronDown, ChevronsUpDown, GripVertical, Loader2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { MutationLike } from '@/shared/types/mutation';
import { extractApiError } from '@/shared/utils/api-error';
import type { genIdentifier } from './module-form-utils';
import { useModuleCategoryStore } from '../lib/module-store';
import { ModuleCategoryDrawer } from './module-category-drawer';
import { CategorySelect } from './module-category-select';

interface Course {
  id: string;
  fullName: string;
  categoryId: string;
}

interface CourseCategory {
  name: string;
  courses: Course[];
}

export interface ModuleFormProps {
  form: UseFormReturn<any>;
  mutation: MutationLike;
  isEdit: boolean;
  handleClose: () => void;
  onSubmit: (values: any) => void;
  selectedCourseIds: string[];
  toggleCourse: (courseId: string) => void;
  coursesByCategory: CourseCategory[];
  openCategories: Set<string>;
  toggleCategory: (name: string) => void;
  name: string;
  coursePopoverOpen: boolean;
  setCoursePopoverOpen: (open: boolean) => void;
  genIdentifierFn: typeof genIdentifier;
  usedCategoryIds?: Set<string>;
}

function SortableCourseItem({
  courseId,
  fullName,
  categoryName,
  index,
}: {
  courseId: string;
  fullName: string;
  categoryName?: string;
  index: number;
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
  coursesByCategory,
  openCategories,
  toggleCategory,
  name,
  coursePopoverOpen,
  setCoursePopoverOpen,
  genIdentifierFn,
  usedCategoryIds,
}: ModuleFormProps) {
  const { deleteCategory } = useModuleCategoryStore();
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [categoryDrawerEditId, setCategoryDrawerEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [usedDeleteAttempt, setUsedDeleteAttempt] = useState<string | null>(null);

  const currentCategory = form.watch('category');

  const handleDeleteCategory = () => {
    if (deleteConfirm) {
      deleteCategory(deleteConfirm);
      if (currentCategory === deleteConfirm) {
        form.setValue('category', '', { shouldValidate: true });
      }
      setDeleteConfirm(null);
    }
  };

  const courseMap = useMemo(() => {
    const map = new Map<string, { fullName: string; categoryName: string }>();
    for (const group of coursesByCategory) {
      for (const course of group.courses) {
        map.set(course.id, { fullName: course.fullName, categoryName: group.name });
      }
    }
    return map;
  }, [coursesByCategory]);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col" noValidate>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
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
            name="category"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Catégorie</FieldLabel>
                <CategorySelect
                  value={field.value}
                  onChange={field.onChange}
                  usedCategoryIds={usedCategoryIds}
                  onEdit={(id) => {
                    setCategoryDrawerEditId(id);
                    setCategoryDrawerOpen(true);
                  }}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onUsedDeleteAttempt={(id) => setUsedDeleteAttempt(id)}
                  onCreate={() => {
                    setCategoryDrawerEditId(null);
                    setCategoryDrawerOpen(true);
                  }}
                />
                <FieldError />
              </FieldGroup>
            )}
          />

          <FieldRoot
            control={form.control}
            name="name"
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
            name="identifier"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Identifiant</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    <Input aria-label="Identifiant" className="text-xs" {...field} />
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        form.setValue('identifier', genIdentifierFn(name), { shouldValidate: true })
                      }
                    >
                      Auto
                    </Button>
                  </div>
                </FieldContent>
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
                    aria-label="Description"
                    className="min-h-24 resize-y text-xs"
                    {...field}
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
                <FieldLabel className="text-xs">Cours liés</FieldLabel>
                <Popover open={coursePopoverOpen} onOpenChange={setCoursePopoverOpen}>
                  <PopoverTrigger asChild>
                    <FieldContent>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-label="Cours liés"
                        className="h-9 w-full justify-between font-normal text-xs"
                      >
                        {selectedCourseIds.length > 0
                          ? `${selectedCourseIds.length} cours sélectionné${
                              selectedCourseIds.length > 1 ? 's' : ''
                            }`
                          : 'Sélectionner des cours…'}

                        <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </FieldContent>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={4}
                    className="w-[--radix-popover-trigger-width] p-0"
                  >
                    <Command className="overflow-hidden">
                      <CommandInput placeholder="Rechercher un cours..." />

                      <CommandEmpty>Aucun cours trouvé.</CommandEmpty>

                      <div className="max-h-100 overflow-y-auto overscroll-contain">
                        {coursesByCategory.map(({ name, courses }) => {
                          const isOpen = openCategories.has(name);

                          return (
                            <CommandGroup key={name}>
                              <button
                                type="button"
                                onClick={() => toggleCategory(name)}
                                className="flex w-full items-center gap-2 px-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                              >
                                <ChevronDown
                                  className={cn(
                                    'size-3 transition-transform',
                                    !isOpen && '-rotate-90',
                                  )}
                                />
                                {name}
                              </button>

                              {isOpen &&
                                courses.map((course) => (
                                  <CommandItem
                                    key={course.id}
                                    value={course.fullName}
                                    onSelect={() => toggleCourse(course.id)}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 size-4',
                                        selectedCourseIds.includes(course.id)
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                    {course.fullName}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          );
                        })}
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedCourseIds.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedCourseIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="mt-2 space-y-1">
                        {selectedCourseIds.map((courseId, index) => {
                          const info = courseMap.get(courseId);
                          return (
                            <SortableCourseItem
                              key={courseId}
                              courseId={courseId}
                              fullName={info?.fullName ?? courseId}
                              categoryName={info?.categoryName}
                              index={index}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                <FieldError />
              </FieldGroup>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-background px-6 py-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            size="lg"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            size="lg"
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {mutation.isPending
              ? isEdit
                ? 'Enregistrement…'
                : 'Création…'
              : isEdit
                ? 'Enregistrer'
                : 'Créer'}
          </Button>
        </div>
      </form>

      <ModuleCategoryDrawer
        open={categoryDrawerOpen}
        editingId={categoryDrawerEditId}
        onOpenChange={(open) => {
          setCategoryDrawerOpen(open);
          if (!open) setCategoryDrawerEditId(null);
        }}
      />

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette catégorie ? Les modules utilisant cette
              catégorie ne seront pas supprimés mais leur catégorie sera réinitialisée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/80"
              onClick={handleDeleteCategory}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!usedDeleteAttempt}
        onOpenChange={(open) => {
          if (!open) setUsedDeleteAttempt(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suppression impossible</AlertDialogTitle>
            <AlertDialogDescription>
              Cette catégorie de module ne peut pas être supprimée car elle contient des modules
              liés. Veuillez déplacer ou supprimer les modules avant de supprimer la catégorie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setUsedDeleteAttempt(null)}>
              Compris
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Field>
  );
}
