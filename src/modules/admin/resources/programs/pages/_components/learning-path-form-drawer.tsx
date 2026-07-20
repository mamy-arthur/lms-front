'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BookOpen, CalendarIcon, Image, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCreateLearningPath } from '../../hooks/useCreateLearningPath';
import { useUpdateLearningPath } from '../../hooks/useUpdateLearningPath';
import { useUploadLearningPathMedia } from '../../hooks/useUploadLearningPathMedia';
import ProgramFlow, { type ProgramFlowHandle } from '../../components/ProgramFlow';
import type { LearningPath, LearningPathCategory } from '../../types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    name: z.string().min(1, 'Le nom est requis').max(255),
    description: z.string().nullable().optional(),
    category_id: z.string().nullable().optional(),
    price: z.number().min(0).nullable().optional(),
    currency: z.string().length(3).optional(),
    published_at: z.string().nullable().optional(),
    show_in_shop: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.price !== null && data.price !== undefined && data.price > 0) {
        return !!data.currency;
      }
      return true;
    },
    { message: 'La devise est requise quand un prix est défini', path: ['currency'] },
  );

type FormValues = z.infer<typeof schema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'MAD', label: 'MAD (د.م.)' },
  { value: 'XOF', label: 'XOF (Fr)' },
];

// ─── Date Picker ─────────────────────────────────────────────────────────────

function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: string | null | undefined;
  onChange: (iso: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-8 w-full justify-between px-3 text-xs font-normal',
            !date && 'text-muted-foreground',
          )}
        >
          <span>{date ? format(date, 'dd MMM yyyy', { locale: fr }) : (placeholder ?? 'Choisir une date')}</span>
          <CalendarIcon className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onChange(d ? d.toISOString() : null);
            setOpen(false);
          }}
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learningPath?: LearningPath;
  categories: LearningPathCategory[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LearningPathFormDrawer({ open, onOpenChange, learningPath, categories }: Props) {
  const isEdit = !!learningPath;

  const createMutation = useCreateLearningPath();
  const updateMutation = useUpdateLearningPath();
  const uploadMedia = useUploadLearningPathMedia();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const flowRef = useRef<ProgramFlowHandle>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: null,
      category_id: null,
      price: null,
      currency: 'EUR',
      published_at: null,
      show_in_shop: false,
    },
  });

  const watchedPrice = watch('price');
  const watchedPublishedAt = watch('published_at');

  // Sync form state when drawer opens
  useEffect(() => {
    if (open) {
      if (learningPath) {
        reset({
          name: learningPath.name,
          description: learningPath.description,
          category_id: learningPath.categoryId,
          price: learningPath.price,
          currency: learningPath.currency ?? 'EUR',
          published_at: learningPath.publishedAt,
          show_in_shop: learningPath.showInShop,
        });
        setImageId(learningPath.image?.id ?? null);
        setImagePreview(learningPath.image?.url ?? null);
      } else {
        reset({
          name: '',
          description: null,
          category_id: null,
          price: null,
          currency: 'EUR',
          published_at: null,
          show_in_shop: false,
        });
        setImageId(null);
        setImagePreview(null);
      }
      setPendingImageFile(null);
    }
  }, [open, learningPath, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setPendingImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPendingImageFile(null);
    setImagePreview(null);
    setImageId(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const onSubmit = async (values: FormValues) => {
    try {
      let finalImageId = imageId;

      // Upload new image if a file was selected
      if (pendingImageFile) {
        const { data } = await uploadMedia.mutateAsync(pendingImageFile);
        finalImageId = data.id;
      }

      const payload = {
        name: values.name,
        description: values.description ?? null,
        category_id: values.category_id ?? null,
        price: values.price ?? null,
        currency: values.currency,
        image: finalImageId,
        published_at: values.published_at ?? null,
        show_in_shop: values.show_in_shop ?? false,
      };

      if (isEdit && learningPath) {
        await updateMutation.mutateAsync({ id: learningPath.id, ...payload });
        toast.success('Parcours mis à jour');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Parcours créé');
      }
      onOpenChange(false);
    } catch {
      toast.error('Une erreur est survenue');
    }
  };

  const isPending = isSubmitting || uploadMedia.isPending || createMutation.isPending || updateMutation.isPending;
  const title = isEdit ? `Modifier — ${learningPath?.name}` : 'Nouveau parcours';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-screen! max-w-screen! flex-col p-0">
        <SheetHeader className="shrink-0 border-b px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                <BookOpen className="size-3.5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">{title}</SheetTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Définissez les informations et construisez le parcours pédagogique.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-6">
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                form="learning-path-form"
                size="sm"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Sauvegarder
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* ── Body: 70 / 30 split ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Flow canvas */}
          <div className="flex-6 overflow-hidden">
            <ProgramFlow
              key={learningPath?.id ?? 'new'}
              ref={flowRef}
              initialNodes={undefined}
              initialEdges={undefined}
              initialNodeOrder={undefined}
            />
          </div>

          {/* Form panel */}
          <div className="flex-4 overflow-hidden border-l">
            <form
              id="learning-path-form"
              onSubmit={handleSubmit(onSubmit)}
              className="h-full overflow-y-auto px-5 py-5"
            >
              <div className="space-y-5">
                {/* Nom */}
                <div className="space-y-1.5">
                  <Label htmlFor="lp-name">Nom du parcours *</Label>
                  <Input
                    id="lp-name"
                    {...register('name')}
                    placeholder="Ex: Devenir chef de projet digital"
                    className="h-8 text-sm"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="lp-description">Description</Label>
                  <Textarea
                    id="lp-description"
                    {...register('description')}
                    placeholder="Décrivez le contenu de ce parcours..."
                    className="min-h-20 resize-none text-sm"
                    rows={3}
                  />
                </div>

                {/* Image */}
                <div className="space-y-1.5">
                  <Label>Image de couverture</Label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <div className="group relative overflow-hidden rounded-lg border">
                      {/* biome-ignore lint/performance/noImgElement: preview of uploaded or existing image */}
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="h-28 w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          Changer
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="size-7"
                          onClick={clearImage}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 text-xs text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
                    >
                      <Image className="size-4" />
                      Cliquer pour ajouter une image
                    </button>
                  )}
                </div>

                {/* Catégorie */}
                <div className="space-y-1.5">
                  <Label>Catégorie</Label>
                  <Select
                    value={watch('category_id') ?? '__none__'}
                    onValueChange={(v) => setValue('category_id', v === '__none__' ? null : v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Aucune catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucune catégorie</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Prix & Devise */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="lp-price">Prix</Label>
                    <Input
                      id="lp-price"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="h-8 text-sm"
                      value={watchedPrice ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setValue('price', val === '' ? null : parseFloat(val));
                      }}
                    />
                    {errors.price && (
                      <p className="text-xs text-destructive">{errors.price.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Devise</Label>
                    <Select
                      value={watch('currency') ?? 'EUR'}
                      onValueChange={(v) => setValue('currency', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.currency && (
                      <p className="text-xs text-destructive">{errors.currency.message}</p>
                    )}
                  </div>
                </div>

                {/* Date de publication */}
                <div className="space-y-1.5">
                  <Label>Date de publication</Label>
                  <DatePickerField
                    value={watchedPublishedAt}
                    onChange={(iso) => setValue('published_at', iso)}
                    placeholder="Non définie"
                  />
                </div>

                {/* Visible en boutique */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Visible en boutique</p>
                    <p className="text-xs text-muted-foreground">
                      Afficher ce parcours dans la boutique
                    </p>
                  </div>
                  <Switch
                    checked={watch('show_in_shop') ?? false}
                    onCheckedChange={(v) => setValue('show_in_shop', v)}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
