'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  File,
  Folder,
  Link,
  ImagePlay,
  Package,
  Loader2,
  Save,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULE_TYPES, type ContentType, type ModuleType } from '../../types';
import { contentTypeSchema, type ContentTypeFormValues } from '../../validation';
import { useCreateContentType } from '../../hooks/useCreateContentType';
import { useUpdateContentType } from '../../hooks/useUpdateContentType';
import { SchemaBuilder } from './schema-builder';

// ─── Module type visual config ────────────────────────────────────────────────

const MODULE_TYPE_CONFIG: Record<ModuleType, { icon: LucideIcon; color: string; bg: string }> = {
  page: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  file: { icon: File, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  folder: { icon: Folder, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  url: { icon: Link, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/40' },
  media: { icon: ImagePlay, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/40' },
  scorm: { icon: Package, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/40' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Maps a persisted ContentType to form values.
 * Fields loaded from the backend have `_isNew: false`.
 */
function toFormValues(ct: ContentType): ContentTypeFormValues {
  return {
    module_type: ct.module_type,
    title: ct.title,
    description: ct.description ?? '',
    fields: ct.fields.map((f) => ({
      _isNew: false,
      type: f.type,
      name: f.name,
      label: f.label,
      required: f.required,
      is_archived: f.is_archived,
      accept: f.accept ?? undefined,
      max_size_mb: f.max_size_mb ?? undefined,
      multiple: f.multiple ?? undefined,
    })),
  };
}

const DEFAULT_VALUES: ContentTypeFormValues = {
  module_type: 'page',
  title: '',
  description: '',
  fields: [],
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface ContentTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing content type. */
  contentType?: ContentType;
  /** Module types already taken by other content types (disabled in create mode). */
  usedModuleTypes?: ModuleType[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContentTypeForm({
  open,
  onOpenChange,
  contentType,
  usedModuleTypes = [],
}: ContentTypeFormProps) {
  const isEdit = !!contentType;
  const existingFieldCount = contentType?.fields.length ?? 0;

  const createMutation = useCreateContentType();
  const updateMutation = useUpdateContentType();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ContentTypeFormValues>({
    resolver: zodResolver(contentTypeSchema),
    defaultValues: contentType ? toFormValues(contentType) : DEFAULT_VALUES,
  });

  const currentModuleType = form.watch('module_type');

  // Re-populate form when the contentType changes (e.g. switching between edit targets)
  useEffect(() => {
    if (open) {
      form.reset(contentType ? toFormValues(contentType) : DEFAULT_VALUES);
    }
  }, [open, contentType, form]);

  const handleSubmit = form.handleSubmit((values) => {
    // Strip the internal `_isNew` flag before sending to the API
    const fields = values.fields.map(({ _isNew: _flag, ...rest }) => rest);
    const payload = {
      module_type: values.module_type,
      title: values.title,
      description: values.description,
      fields,
    };

    if (isEdit && contentType) {
      updateMutation.mutate(
        { id: contentType.id, payload },
        {
          onSuccess: () => {
            toast.success('Content Type mis à jour');
            onOpenChange(false);
          },
          onError: () => toast.error('Erreur lors de la mise à jour'),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Content Type créé');
          onOpenChange(false);
        },
        onError: () => toast.error('Erreur lors de la création'),
      });
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl max-w-237.5! p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <SheetTitle>
            {isEdit ? 'Modifier le Content Type' : 'Créer un type de contenu'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Modifiez les informations et le schéma de champs.'
              : 'Définissez le type, le titre et construisez le schéma de champs.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-5 space-y-8">
                {/* ── General information ──────────────────────────────── */}
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold">Informations sur le type de contenu</h2>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      placeholder="Ex : Fiche pédagogique"
                      {...form.register('title')}
                    />
                    {form.formState.errors.title && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Description optionnelle du type de contenu…"
                      className="resize-none"
                      rows={3}
                      {...form.register('description')}
                    />
                    {form.formState.errors.description && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Module type – card grid */}
                  <div className="space-y-2">
                    <Label>Type de contenu</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {MODULE_TYPES.map((m) => {
                        const config = MODULE_TYPE_CONFIG[m.value];
                        const Icon = config.icon;
                        const isUsed = usedModuleTypes.includes(m.value);
                        const isSelected = currentModuleType === m.value && !isUsed;
                        const isDisabled = isEdit || isUsed;

                        return (
                          <button
                            key={m.value}
                            type="button"
                            disabled={isDisabled}
                            onClick={() =>
                              form.setValue('module_type', m.value, { shouldValidate: true })
                            }
                            className={cn(
                              'cursor-pointer relative flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-colors',
                              isSelected
                                ? 'border-(--color-primary) bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-muted/30',
                              isDisabled && !isSelected && 'opacity-50 cursor-not-allowed',
                            )}
                          >
                            <div className={cn('p-2 rounded-md', config.bg)}>
                              <Icon className={cn('size-5', config.color)} />
                            </div>
                            <span className="text-xs font-medium leading-none">{m.label}</span>
                            {isUsed && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4 pointer-events-none"
                              >
                                Déjà utilisé
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {form.formState.errors.module_type && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.module_type.message}
                      </p>
                    )}
                  </div>
                </section>

                {/* ── Schema Builder ───────────────────────────────────── */}
                <section>
                  <SchemaBuilder
                    control={form.control}
                    existingFieldCount={existingFieldCount}
                    isModuleSelected={!usedModuleTypes.includes(currentModuleType)}
                  />
                </section>
              </div>
            </ScrollArea>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <div className="border-t px-6 py-4 flex items-center justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-(--color-primary) hover:bg-(--color-primary)/80"
              >
                <Save />
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? 'Enregistrer les modifications' : 'Créer le type de contenu'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
