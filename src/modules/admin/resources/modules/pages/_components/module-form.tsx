/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Check, ChevronDown, ChevronsUpDown, GripVertical, ImagePlus, Loader2 } from 'lucide-react';
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
import { Command, CommandEmpty, CommandInput, CommandItem } from '@/components/ui/command';
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
import { RichTextEditor, ALIGN_STYLES } from '@modules/shared/components/tiptap/RichTextEditor';
import {
  ImageInsertDialog,
  type ImageConfirmAttrs,
} from '@modules/shared/components/tiptap/ImageInsertDialog';
import { adminModulesApi } from '../../api';
import { cn } from '@/lib/utils';
import type { MutationLike } from '@/shared/types/mutation';
import { extractApiError } from '@/shared/utils/api-error';
import type { genIdentifier } from './module-form-utils';
import { CompetencyCategoryModal } from '../../components/categories/CompetencyCategoryModal';
import { CompetencyCategorySelect } from '../../components/categories/CompetencyCategorySelect';

interface Course {
  id: string;
  fullName: string;
  categoryId: string;
}

interface CourseCategory {
  key: string;
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
  shortname: string;
  coursePopoverOpen: boolean;
  setCoursePopoverOpen: (open: boolean) => void;
  genIdentifierFn: typeof genIdentifier;
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

/**
 * Image upload button injected into the description RichTextEditor toolbar.
 * Supports both TipTap mode (ctx undefined) and HTML-source mode (ctx.insertHtml)
 * to match the behaviour of the certificate RichTextEditor.
 */
function ModuleDescriptionImageButton({
  editor,
  ctx,
}: {
  editor: import('@tiptap/react').Editor;
  ctx?: { insertHtml: (html: string) => void; insertText: (text: string) => void };
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const uploadImage = async (file: File): Promise<{ mediaId: string; src: string }> => {
    const res = await adminModulesApi.uploadMedia(file);
    return { mediaId: res.id, src: res.url };
  };

  const handleConfirm = ({ src, alt, width, height, align, mediaId }: ImageConfirmAttrs) => {
    if (ctx?.insertHtml) {
      const alignStyle = ALIGN_STYLES[align] ?? ALIGN_STYLES.left;
      const sizeStyle =
        `${width ? `width: ${width}px; ` : ''}${height ? `height: ${height}px;` : ''}`.trim();
      const style = sizeStyle ? `${alignStyle} ${sizeStyle}` : alignStyle;
      const widthAttr = width ? ` width="${width}"` : '';
      const heightAttr = height ? ` height="${height}"` : '';
      const mediaAttr = mediaId ? ` data-media-id="${mediaId}"` : '';
      ctx.insertHtml(
        `<img src="${src}" alt="${alt}"${widthAttr}${heightAttr} style="${style}"${mediaAttr}>`,
      );
      return;
    }
    (
      editor.chain().focus() as unknown as {
        setImage: (attrs: Record<string, unknown>) => { run(): boolean };
      }
    )
      .setImage({ src, alt, width, height, align, ...(mediaId ? { dataMediaId: mediaId } : {}) })
      .run();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Insérer une image"
        title="Insérer une image"
        onClick={() => setDialogOpen(true)}
        className="size-8"
      >
        <ImagePlus className="size-4" />
      </Button>
      <ImageInsertDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirm}
        onFileUpload={uploadImage}
      />
    </>
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
  shortname,
  coursePopoverOpen,
  setCoursePopoverOpen,
  genIdentifierFn,
}: ModuleFormProps) {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

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
            name="category_id"
            render={({ field }) => (
              <FieldGroup>
                <FieldLabel className="text-xs">Catégorie</FieldLabel>
                <CompetencyCategorySelect
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onCreate={() => {
                    setCategoryModalOpen(true);
                  }}
                />
                <FieldError />
              </FieldGroup>
            )}
          />

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
            name="idnumber"
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
                      className="h-7"
                      onClick={() =>
                        form.setValue('idnumber', genIdentifierFn(shortname), {
                          shouldValidate: true,
                        })
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
                  <RichTextEditor
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Décrivez le module…"
                    outputFormat="html"
                    toolbarExtras={(editor, ctx) => (
                      <ModuleDescriptionImageButton editor={editor} ctx={ctx} />
                    )}
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

                      {coursesByCategory.length === 0 && (
                        <CommandEmpty>Aucun cours trouvé.</CommandEmpty>
                      )}

                      <div className="max-h-100 overflow-y-auto overscroll-contain">
                        {coursesByCategory.map(({ key, name, courses }) => {
                          const isOpen = openCategories.has(key);

                          return (
                            <div key={key}>
                              <button
                                type="button"
                                onClick={() => toggleCategory(key)}
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
                            </div>
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

      <CompetencyCategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        onCreated={(created) => {
          form.setValue('category_id', created.id, { shouldValidate: true });
        }}
      />
    </Field>
  );
}
