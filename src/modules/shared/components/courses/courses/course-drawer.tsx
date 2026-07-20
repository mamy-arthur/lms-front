import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Check, Save, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useCoursesStore, getCategoryPath } from '../lib/course-store';
import type { Course } from '../types/index';
import { courseSectionsApi } from '@/shared/api/courses.api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const schema = z.object({
  fullName: z.string().min(2, 'Nom requis (min 2 caractères)'),
  shortName: z.string().min(1, 'Nom abrégé requis'),
  categoryId: z.string().nullable(),
  visible: z.boolean(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
};

export function CourseDrawer({ open, onOpenChange, course }: Props) {
  const { categories, upsertCourse, upsertCategory } = useCoursesStore();
  const [catOpen, setCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const defaults = useMemo<FormValues>(
    () => ({
      fullName: course?.fullName ?? '',
      shortName: course?.shortName ?? '',
      categoryId: course?.categoryId ?? null,
      visible: course?.visible ?? true,
      description: course?.description ?? '',
    }),
    [course],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) form.reset(defaults);
  }, [open, defaults, form]);

  const categoryId = form.watch('categoryId');
  const visible = form.watch('visible');

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const saved = await upsertCourse({ ...values, id: course?.id });
      if (!course) {
        await courseSectionsApi.create(saved.id, { name: 'Introduction' });
      }
      toast.success(course ? 'Cours mis à jour' : 'Cours créé');
      onOpenChange(false);
      if (!course) {
        router.push(`/admin/courses/${saved.id}`);
      }
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{course ? 'Modifier le cours' : 'Nouveau cours'}</SheetTitle>
          <SheetDescription>
            {course
              ? 'Modifiez les informations de ce cours.'
              : 'Renseignez les informations pour créer un nouveau cours.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet du cours</Label>
              <Input
                id="fullName"
                placeholder="Introduction à React 19"
                {...form.register('fullName')}
              />
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortName">Nom abrégé</Label>
              <Input id="shortName" placeholder="REACT19" {...form.register('shortName')} />
              {form.formState.errors.shortName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.shortName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Popover open={catOpen} onOpenChange={setCatOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {selectedCategory
                      ? getCategoryPath(categories, selectedCategory.id)
                      : 'Sélectionner une catégorie…'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Rechercher ou créer…"
                      value={newCatName}
                      onValueChange={setNewCatName}
                    />
                    <CommandList>
                      <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={getCategoryPath(categories, cat.id)}
                            onSelect={() => {
                              form.setValue('categoryId', cat.id, { shouldValidate: true });
                              setCatOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 size-4',
                                categoryId === cat.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {getCategoryPath(categories, cat.id)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {newCatName.trim() && (
                        <>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem
                              onSelect={async () => {
                                try {
                                  const created = await upsertCategory({
                                    name: newCatName.trim(),
                                    parentId: null,
                                  });
                                  form.setValue('categoryId', created.id, {
                                    shouldValidate: true,
                                  });
                                  setNewCatName('');
                                  setCatOpen(false);
                                  toast.success('Catégorie créée');
                                } catch {
                                  toast.error('Erreur lors de la création de la catégorie');
                                }
                              }}
                            >
                              <Plus className="mr-2 size-4" />
                              Créer « {newCatName.trim()} »
                            </CommandItem>
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="visible">Visibilité</Label>
                <p className="text-xs text-muted-foreground">
                  {visible ? 'Publié' : 'Brouillon (masqué)'}
                </p>
              </div>
              <Switch
                id="visible"
                checked={visible}
                onCheckedChange={(v) => form.setValue('visible', v)}
                className="data-[state=checked]:bg-(--color-primary)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="À propos de ce cours…"
                {...form.register('description')}
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-(--color-primary) hover:bg-(--color-primary)/80"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
