'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertCircle, BookOpen, CalendarIcon, Image, Loader2, Save, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getApiErrorMessage, getFormValidationMessage } from '@/shared/lib/errors';
import { useCreateLearningPath } from '../../hooks/useCreateLearningPath';
import { useUpdateLearningPath } from '../../hooks/useUpdateLearningPath';
import { useUploadLearningPathMedia } from '../../hooks/useUploadLearningPathMedia';
import { useLinkCompetencyToLearningPath } from '../../hooks/useLinkCompetencyToLearningPath';
import { useUnlinkCompetencyFromLearningPath } from '../../hooks/useUnlinkCompetencyFromLearningPath';
import { useModules } from '@/modules/admin/resources/modules/hooks/useModules';
import ProgramFlow, {
  type ProgramFlowHandle,
  type ModuleStepPayload,
  type StepNode,
} from '../../components/ProgramFlow';
import {
  DURATION_UNITS,
  durationToMinutes,
  minutesToDuration,
  type DurationUnit,
} from '../../lib/duration';
import type { LearningPath, LearningPathCategory } from '../../types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const durationUnitSchema = z.enum(['minutes', 'hours', 'days', 'months', 'years']);

const schema = z
  .object({
    name: z.string().min(1, 'Le nom est requis').max(255),
    description: z.string().nullable().optional(),
    category_id: z.string().nullable().optional(),
    price: z.number().min(0).nullable().optional(),
    currency: z.string().length(3).optional(),
    published_at: z.string().nullable().optional(),
    show_in_shop: z.boolean().optional(),
    duration_value: z.number().min(0).nullable().optional(),
    duration_unit: durationUnitSchema.optional(),
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

const CANVAS_X = 300;
const NODE_GAP = 150;

function toApiDuration(
  value: number | null | undefined,
  unit: DurationUnit | undefined,
): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return durationToMinutes(value, unit ?? 'minutes');
}

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
          <span>
            {date
              ? format(date, 'dd MMM yyyy', { locale: fr })
              : (placeholder ?? 'Choisir une date')}
          </span>
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
  const hasCompetencies = isEdit && (learningPath?.competencies?.length ?? 0) > 0;

  const createMutation = useCreateLearningPath();
  const updateMutation = useUpdateLearningPath();
  const uploadMedia = useUploadLearningPathMedia();
  const linkCompetency = useLinkCompetencyToLearningPath();
  const unlinkCompetency = useUnlinkCompetencyFromLearningPath();

  // Pre-fetch all modules so competency names are ready when the flow renders
  const { data: modulesResult, isLoading: isLoadingModules } = useModules();

  const moduleNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of modulesResult?.data ?? []) {
      map.set(m.id, m.shortname);
    }
    return map;
  }, [modulesResult]);

  // Immediately unlink a competency from the backend when removed from the flow (edit mode only)
  const handleUnlinkCompetency = useCallback(
    (competencyId: string) => {
      if (!learningPath) return;
      const wasOriginallyLinked = learningPath.competencies.some(
        (c) => c.competencyId === competencyId,
      );
      if (!wasOriginallyLinked) return;
      if (unlinkedDuringSessionRef.current.has(competencyId)) return;
      unlinkedDuringSessionRef.current.add(competencyId);
      unlinkCompetency.mutate(
        { id: learningPath.id, competencyId },
        {
          onSuccess: () => toast.success('Compétence détachée du parcours'),
          onError: (err) => {
            unlinkedDuringSessionRef.current.delete(competencyId);
            toast.error(
              getApiErrorMessage(
                err,
                'Impossible de détacher la compétence. Vérifiez votre connexion et réessayez.',
              ),
            );
          },
        },
      );
    },
    [learningPath, unlinkCompetency],
  );

  // Build initial flow nodes/edges from existing competencies (sorted by position)
  const initialFlow = useMemo(() => {
    if (!learningPath?.competencies.length) return null;

    const sorted = [...learningPath.competencies].sort((a, b) => a.position - b.position);
    const emailNodeId = 'email-start';

    const emailNode: StepNode = {
      id: emailNodeId,
      type: 'programStep',
      position: { x: CANVAS_X, y: 0 },
      data: { stepType: 'email', label: 'Email de démarrage' },
    };

    const moduleNodes: StepNode[] = sorted.map((comp, idx) => ({
      id: `step-module-${comp.competencyId}`,
      type: 'programStep',
      position: {
        x: comp.locationX ?? CANVAS_X,
        y: comp.locationY ?? (idx + 1) * NODE_GAP,
      },
      data: {
        stepType: 'module',
        label: moduleNameMap.get(comp.competencyId) ?? comp.competencyId,
        moduleId: comp.competencyId,
      },
    }));

    const nodes = [emailNode, ...moduleNodes];
    const nodeOrder = nodes.map((n) => n.id);
    const edges = nodeOrder.slice(1).map((targetId, idx) => ({
      id: `e-${nodeOrder[idx]}-${targetId}`,
      source: nodeOrder[idx],
      target: targetId,
      type: 'configurableEdge' as const,
      animated: true,
    }));

    return { nodes, edges, nodeOrder };
  }, [learningPath, moduleNameMap]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const flowRef = useRef<ProgramFlowHandle>(null);
  /** Competencies unlinked during this edit session (editingPath snapshot may be stale). */
  const unlinkedDuringSessionRef = useRef<Set<string>>(new Set());
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
      duration_value: null,
      duration_unit: 'hours',
    },
  });

  const watchedPrice = watch('price');
  const watchedPublishedAt = watch('published_at');
  const watchedDurationValue = watch('duration_value');
  const watchedDurationUnit = watch('duration_unit');

  // Sync form state when drawer opens
  useEffect(() => {
    if (open) {
      if (learningPath) {
        const durationParts =
          learningPath.duration !== null && learningPath.duration !== undefined
            ? minutesToDuration(learningPath.duration)
            : { value: null as number | null, unit: 'hours' as DurationUnit };
        reset({
          name: learningPath.name,
          description: learningPath.description,
          category_id: learningPath.categoryId,
          price: learningPath.price,
          currency: learningPath.currency ?? 'EUR',
          published_at: learningPath.publishedAt,
          show_in_shop: learningPath.showInShop,
          duration_value: durationParts.value,
          duration_unit: durationParts.unit,
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
          duration_value: null,
          duration_unit: 'hours',
        });
        setImageId(null);
        setImagePreview(null);
      }
      setPendingImageFile(null);
      unlinkedDuringSessionRef.current = new Set();
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
        try {
          const { data } = await uploadMedia.mutateAsync(pendingImageFile);
          finalImageId = data.id;
        } catch (err) {
          toast.error(
            getApiErrorMessage(
              err,
              "Impossible d'uploader l'image. Utilisez un JPEG, PNG, GIF ou WebP, puis réessayez.",
            ),
          );
          return;
        }
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
        duration: toApiDuration(values.duration_value, values.duration_unit),
      };

      let lpId: string;

      try {
        if (isEdit && learningPath) {
          await updateMutation.mutateAsync({ id: learningPath.id, ...payload });
          lpId = learningPath.id;
          toast.success('Parcours mis à jour');
        } else {
          const result = await createMutation.mutateAsync(payload);
          lpId = result.data.id;
          toast.success('Parcours créé');
        }
      } catch (err) {
        toast.error(
          getApiErrorMessage(
            err,
            "Impossible d'enregistrer le parcours. Vérifiez les informations saisies et réessayez.",
          ),
        );
        return;
      }

      // Link new module competencies with canvas positions (location_x / location_y)
      const flowPayload = flowRef.current?.getPayload();
      const moduleSteps = (flowPayload?.etapes ?? []).filter(
        (s): s is ModuleStepPayload => s.type === 'module' && !!s.moduleId,
      );
      const alreadyLinked = new Set(
        (isEdit ? (learningPath?.competencies ?? []) : [])
          .filter((c) => !unlinkedDuringSessionRef.current.has(c.competencyId))
          .map((c) => c.competencyId),
      );

      try {
        for (const step of moduleSteps) {
          const competencyId = step.moduleId!;
          if (alreadyLinked.has(competencyId)) continue;

          await linkCompetency.mutateAsync({
            id: lpId,
            competencyId,
            locationX: Math.round(step.position.x),
            locationY: Math.round(step.position.y),
          });
        }
      } catch (err) {
        toast.error(
          getApiErrorMessage(
            err,
            'Le parcours a été enregistré, mais la synchronisation des compétences a échoué. Rouvrez le parcours et réessayez.',
          ),
        );
        return;
      }

      onOpenChange(false);
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Une erreur inattendue est survenue lors de l'enregistrement. Réessayez.",
        ),
      );
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    toast.error(getFormValidationMessage(formErrors));
  };

  const isPending =
    isSubmitting || uploadMedia.isPending || createMutation.isPending || updateMutation.isPending;
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
                <SheetDescription className="mt-0.5 text-xs">
                  Définissez les informations et construisez le parcours pédagogique.
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                form="learning-path-form"
                className="bg-(--color-primary) hover:bg-(--color-primary)/80"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Save />}
                Enregistrer
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* ── Body: 70 / 30 split ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Flow canvas */}
          <div className="flex-6 overflow-hidden">
            {isEdit && isLoadingModules ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ProgramFlow
                key={learningPath?.id ?? 'new'}
                ref={flowRef}
                initialNodes={initialFlow?.nodes}
                initialEdges={initialFlow?.edges}
                initialNodeOrder={initialFlow?.nodeOrder}
                onUnlinkCompetency={isEdit ? handleUnlinkCompetency : undefined}
                learningPathId={learningPath?.id}
              />
            )}
          </div>

          {/* Form panel */}
          <div className="flex-4 overflow-hidden border-l">
            <form
              id="learning-path-form"
              onSubmit={handleSubmit(onSubmit, onInvalid)}
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
                    className="text-sm"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
                      <img src={imagePreview} alt="Aperçu" className="h-28 w-full object-cover" />
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
                      className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/25 text-xs text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
                    >
                      <Image className="size-4" />
                      Cliquer pour ajouter une image
                    </button>
                  )}
                </div>
                {/* Catégorie */}
                <div className="space-y-1.5">
                  <Label>Catégorie</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {categories.map((cat) => {
                      const isSelected = watch('category_id') === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setValue('category_id', isSelected ? null : cat.id)}
                        >
                          <Badge
                            variant={isSelected ? 'default' : 'outline'}
                            className={`cursor-pointer text-xs px-2.5 py-1 h-auto rounded-lg transition-colors ${isSelected ? 'bg-(--color-primary) text-primary-foreground' : 'bg-muted/10 text-muted-foreground'}`}
                          >
                            {cat.name}
                          </Badge>
                        </button>
                      );
                    })}
                    {categories.length === 0 && (
                      <p className="text-xs text-muted-foreground">Aucune catégorie disponible</p>
                    )}
                  </div>
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
                      <SelectTrigger className="h-8 text-xs w-full">
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
                {/* Durée de formation */}
                <div className="space-y-1.5">
                  <Label>Durée de formation</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id="lp-duration"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ex: 2"
                      className="h-8 text-sm"
                      value={watchedDurationValue ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setValue('duration_value', val === '' ? null : parseFloat(val));
                      }}
                    />
                    <Select
                      value={watchedDurationUnit ?? 'hours'}
                      onValueChange={(v) => setValue('duration_unit', v as DurationUnit)}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.duration_value && (
                    <p className="text-xs text-destructive">{errors.duration_value.message}</p>
                  )}
                </div>
                {/* Date de publication */}{' '}
                <div className="space-y-1.5">
                  <Label>Date de publication</Label>
                  <DatePickerField
                    value={watchedPublishedAt}
                    onChange={(iso) => setValue('published_at', iso)}
                    placeholder="Non définie"
                  />
                </div>
                {/* Visible en boutique */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-xs font-medium">Visible en boutique</p>
                      <p className="text-xs text-muted-foreground">
                        Afficher ce parcours dans la boutique
                      </p>
                    </div>
                    <Switch
                      checked={watch('show_in_shop') ?? false}
                      onCheckedChange={(v) => setValue('show_in_shop', v)}
                      disabled={!hasCompetencies}
                    />
                  </div>
                  {!hasCompetencies && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 mt-5">
                      <AlertCircle className="size-3.5 shrink-0" />
                      Ce parcours ne contient aucune compétence et ne peut pas être publié dans la
                      boutique.
                    </p>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
