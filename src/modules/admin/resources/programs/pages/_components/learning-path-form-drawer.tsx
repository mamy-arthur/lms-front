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
import { useUpdateCompetencyLocation } from '../../hooks/useUpdateCompetencyLocation';
import { useUpdateEvaluationLocation } from '../../hooks/useUpdateEvaluationLocation';
import { useModules } from '@/modules/admin/resources/modules/hooks/useModules';
import { useLearningPathQuery } from '../../hooks/useLearningPathQuery';
import { useEvaluationsQuery } from '../../hooks/useEvaluationsQuery';
import ProgramFlow, { type StepNode } from '../../components/ProgramFlow';
import type { CreateEvaluationPayload } from '@/shared/api/evaluations.api';
import { useCreateEvaluation } from '../../hooks/useCreateEvaluation';
import { useDeleteEvaluation } from '../../hooks/useDeleteEvaluation';
import { useAssignMailTemplate } from '../../hooks/useAssignMailTemplate';
import { useAssignCertificate } from '../../hooks/useAssignCertificate';
import { useDetachCertificate } from '../../hooks/useDetachCertificate';
import {
  DURATION_UNITS,
  durationToMinutes,
  minutesToDuration,
  type DurationUnit,
} from '../../lib/duration';
import type { LearningPathCategory } from '../../types';

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
  learningPathId?: string;
  categories: LearningPathCategory[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LearningPathFormDrawer({ open, onOpenChange, learningPathId, categories }: Props) {
  const isEdit = !!learningPathId;

  const { data: learningPath, isLoading: isLoadingPath } = useLearningPathQuery(
    open && isEdit ? learningPathId : null,
  );

  // Fetch full evaluation details (includes question_bank_ids) for the initial flow
  const { data: evaluationsData, isLoading: isLoadingEvaluations } = useEvaluationsQuery(
    open && isEdit ? learningPathId : null,
  );

  const hasCompetencies = isEdit && (learningPath?.competencies?.length ?? 0) > 0;

  const [flowHasModules, setFlowHasModules] = useState(hasCompetencies);
  const canPublish = hasCompetencies || flowHasModules;

  const createMutation = useCreateLearningPath();
  const updateMutation = useUpdateLearningPath();
  const uploadMedia = useUploadLearningPathMedia();
  const linkCompetency = useLinkCompetencyToLearningPath();
  const unlinkCompetency = useUnlinkCompetencyFromLearningPath();
  const createEvaluation = useCreateEvaluation();
  const deleteEvaluation = useDeleteEvaluation();
  const assignMailTemplate = useAssignMailTemplate();
  const assignCertificate = useAssignCertificate();
  const detachCertificate = useDetachCertificate();
  const updateCompetencyLocation = useUpdateCompetencyLocation();
  const updateEvaluationLocation = useUpdateEvaluationLocation();

  // Pre-fetch all modules so competency names are ready when the flow renders
  const { data: modulesResult, isLoading: isLoadingModules } = useModules();

  const moduleNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of modulesResult?.data ?? []) {
      map.set(m.id, m.shortname);
    }
    return map;
  }, [modulesResult]);

  // Build initial flow nodes/edges from existing competencies + evaluations
  const initialFlow = useMemo(() => {
    if (!learningPath) return null;

    const sorted = [...learningPath.competencies].sort((a, b) => a.position - b.position);
    const evaluations = learningPath.evaluations ?? [];
    const emailNodeId = 'email-start';

    // Map full evaluation details (question_bank_ids, question_count, max_attempts)
    const evDetailsMap = new Map((evaluationsData?.data ?? []).map((ev) => [ev.id, ev]));

    const emailNode: StepNode = {
      id: emailNodeId,
      type: 'programStep',
      position: { x: CANVAS_X, y: 0 },
      data: {
        stepType: 'email',
        label: learningPath.mailTemplate?.name ?? "Choisir l'email",
        emailTemplateId: learningPath.mailTemplate?.id,
        emailTemplateName: learningPath.mailTemplate?.name,
      },
    };

    const allNodes: StepNode[] = [emailNode];
    let currentY = NODE_GAP;

    for (const comp of sorted) {
      const moduleY = comp.locationY ?? currentY;
      allNodes.push({
        id: `step-module-${comp.competencyId}`,
        type: 'programStep',
        position: { x: comp.locationX ?? CANVAS_X, y: moduleY },
        data: {
          stepType: 'module',
          label: moduleNameMap.get(comp.competencyId) ?? comp.competencyId,
          moduleId: comp.competencyId,
        },
      });
      currentY = moduleY + NODE_GAP;

      // Insert PARTIAL evaluations linked to this competency (sorted by position)
      const partialEvals = evaluations
        .filter((e) => e.precedingCompetencyId === comp.competencyId)
        .sort((a, b) => a.position - b.position);
      for (const ev of partialEvals) {
        const evDetail = evDetailsMap.get(ev.id);
        const evalX = evDetail?.location_x ?? CANVAS_X;
        const evalY = evDetail?.location_y ?? currentY;
        allNodes.push({
          id: `step-eval-${ev.id}`,
          type: 'programStep',
          position: { x: evalX, y: evalY },
          data: {
            stepType: 'evaluation-intermediate',
            label: ev.title,
            evaluationId: ev.id,
            evaluationConfig: {
              title: ev.title,
              durationEnabled: false,
              durationHours: 0,
              durationMinutes: 30,
              questionCount: evDetail?.question_count ?? 20,
              attemptCount: evDetail?.max_attempts ?? 1,
              questionBankIds: evDetail?.question_bank_ids ?? [],
              questionBankNames: [],
            },
          },
        });
        currentY = evalY + NODE_GAP;
      }
    }

    // FINAL evaluations (no preceding competency) at the end
    const finalEvals = evaluations
      .filter((e) => e.precedingCompetencyId === null)
      .sort((a, b) => a.position - b.position);
    for (const ev of finalEvals) {
      const evDetail = evDetailsMap.get(ev.id);
      const evalX = evDetail?.location_x ?? CANVAS_X;
      const evalY = evDetail?.location_y ?? currentY;
      allNodes.push({
        id: `step-eval-${ev.id}`,
        type: 'programStep',
        position: { x: evalX, y: evalY },
        data: {
          stepType: 'evaluation-final',
          label: ev.title,
          evaluationId: ev.id,
          evaluationConfig: {
            title: ev.title,
            durationEnabled: false,
            durationHours: 0,
            durationMinutes: 30,
            questionCount: evDetail?.question_count ?? 20,
            attemptCount: evDetail?.max_attempts ?? 1,
            questionBankIds: evDetail?.question_bank_ids ?? [],
            questionBankNames: [],
          },
        },
      });
      currentY = evalY + NODE_GAP;
    }

    // Attestation node at the very end if a certificate is attached
    if (learningPath.certificate) {
      allNodes.push({
        id: 'attestation-end',
        type: 'programStep',
        position: { x: CANVAS_X, y: currentY },
        data: {
          stepType: 'attestation',
          label: learningPath.certificate.name,
          attestationId: learningPath.certificate.id,
        },
      });
    }

    const nodeOrder = allNodes.map((n) => n.id);
    const edges = nodeOrder.slice(1).map((targetId, idx) => ({
      id: `e-${nodeOrder[idx]}-${targetId}`,
      source: nodeOrder[idx],
      target: targetId,
      type: 'configurableEdge' as const,
      animated: true,
    }));

    return { nodes: allNodes, edges, nodeOrder };
  }, [learningPath, moduleNameMap, evaluationsData]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);

  // Lazy LP ID: set when a new LP is auto-created on the first flow action
  const [lazyLpId, setLazyLpId] = useState<string | null>(null);
  const currentLpId = learningPath?.id ?? lazyLpId;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
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

  // Get the current LP ID, creating the LP lazily if the user adds a flow element before saving
  const getOrCreateLpId = useCallback(async (): Promise<string> => {
    if (currentLpId) return currentLpId;
    const msg = "Configurez d'abord l'email de démarrage avant d'ajouter des éléments.";
    toast.error(msg);
    throw new Error(msg);
  }, [currentLpId]);

  // Assign mail template — auto-creates the LP if it doesn't exist yet
  const handleMailTemplateAssign = useCallback(
    async (mailTemplateId: string) => {
      let lpId = currentLpId;
      if (!lpId) {
        const name = getValues('name')?.trim() || 'Nouvelle formation';
        if (!getValues('name')?.trim()) setValue('name', 'Nouvelle formation');
        const result = await createMutation.mutateAsync({
          name,
          description: null,
          category_id: null,
          price: null,
          currency: 'EUR',
          image: null,
          published_at: null,
          show_in_shop: false,
          duration: null,
        });
        lpId = result.data.id;
        setLazyLpId(lpId);
      }
      await assignMailTemplate.mutateAsync({ learningPathId: lpId, mailTemplateId });
    },
    [currentLpId, getValues, setValue, createMutation, assignMailTemplate],
  );

  // Assign certificate — LP must already exist (requires mail template first)
  const handleCertificateAssign = useCallback(
    async (certificateId: string) => {
      const lpId = await getOrCreateLpId();
      await assignCertificate.mutateAsync({ learningPathId: lpId, certificateId });
    },
    [getOrCreateLpId, assignCertificate],
  );

  // Detach certificate
  const handleCertificateDetach = useCallback(async () => {
    if (!currentLpId) return;
    await detachCertificate.mutateAsync({ learningPathId: currentLpId });
  }, [currentLpId, detachCertificate]);

  // Immediately link a module when added to the flow
  const handleModuleAdd = useCallback(
    async (moduleId: string, position: { x: number; y: number }) => {
      const lpId = await getOrCreateLpId();
      await linkCompetency.mutateAsync({
        id: lpId,
        competencyId: moduleId,
        locationX: Math.round(position.x),
        locationY: Math.round(position.y),
      });
    },
    [getOrCreateLpId, linkCompetency],
  );

  // Immediately unlink a module when removed from the flow
  const handleModuleRemove = useCallback(
    async (moduleId: string) => {
      if (!currentLpId) return;
      await unlinkCompetency.mutateAsync({ id: currentLpId, competencyId: moduleId });
    },
    [currentLpId, unlinkCompetency],
  );

  // Immediately create an evaluation when added to the flow
  const handleEvalCreate = useCallback(
    async (data: CreateEvaluationPayload): Promise<string> => {
      const lpId = await getOrCreateLpId();
      const res = await createEvaluation.mutateAsync({ learningPathId: lpId, ...data });
      return res.id;
    },
    [getOrCreateLpId, createEvaluation],
  );

  // Immediately delete an evaluation when removed from the flow
  const handleEvalDelete = useCallback(
    async (evaluationId: string) => {
      if (!currentLpId) return;
      await deleteEvaluation.mutateAsync({ evaluationId, learningPathId: currentLpId });
    },
    [currentLpId, deleteEvaluation],
  );

  // Update module canvas position when dragged
  const handleModuleMove = useCallback(
    async (moduleId: string, position: { x: number; y: number }) => {
      if (!currentLpId) return;
      await updateCompetencyLocation.mutateAsync({
        learningPathId: currentLpId,
        competencyId: moduleId,
        locationX: position.x,
        locationY: position.y,
      });
    },
    [currentLpId, updateCompetencyLocation],
  );

  // Update evaluation canvas position when dragged
  const handleEvalMove = useCallback(
    async (evaluationId: string, position: { x: number; y: number }) => {
      if (!currentLpId) return;
      await updateEvaluationLocation.mutateAsync({
        evaluationId,
        learningPathId: currentLpId,
        locationX: position.x,
        locationY: position.y,
      });
    },
    [currentLpId, updateEvaluationLocation],
  );

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
        setLazyLpId(null);
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

      if (currentLpId) {
        // LP already exists (edit mode or lazily created) — only save form metadata
        try {
          await updateMutation.mutateAsync({ id: currentLpId, ...payload });
          toast.success(isEdit ? 'Parcours mis à jour' : 'Parcours créé');
        } catch (err) {
          toast.error(
            getApiErrorMessage(
              err,
              "Impossible d'enregistrer le parcours. Vérifiez les informations saisies et réessayez.",
            ),
          );
          return;
        }
      } else {
        // New LP, no flow actions taken yet — create with metadata only
        try {
          await createMutation.mutateAsync(payload);
          toast.success('Parcours créé');
        } catch (err) {
          toast.error(
            getApiErrorMessage(
              err,
              'Impossible de créer le parcours. Vérifiez les informations saisies et réessayez.',
            ),
          );
          return;
        }
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
    isSubmitting ||
    uploadMedia.isPending ||
    createMutation.isPending ||
    updateMutation.isPending ||
    linkCompetency.isPending ||
    unlinkCompetency.isPending;
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
            {isEdit && (isLoadingModules || isLoadingPath || isLoadingEvaluations) ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ProgramFlow
                key={learningPathId ?? 'new'}
                initialNodes={initialFlow?.nodes}
                initialEdges={initialFlow?.edges}
                initialNodeOrder={initialFlow?.nodeOrder}
                onModulesChange={setFlowHasModules}
                onModuleAdd={handleModuleAdd}
                onModuleRemove={handleModuleRemove}
                onModuleMove={handleModuleMove}
                onEvalCreate={handleEvalCreate}
                onEvalDelete={handleEvalDelete}
                onEvalMove={handleEvalMove}
                onMailTemplateAssign={handleMailTemplateAssign}
                onCertificateAssign={handleCertificateAssign}
                onCertificateDetach={handleCertificateDetach}
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
                      aria-label="Visible en boutique"
                      checked={watch('show_in_shop') ?? false}
                      onCheckedChange={(v) => setValue('show_in_shop', v)}
                      disabled={!canPublish}
                    />
                  </div>
                  {!canPublish && (
                    <p className="mt-5 flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                      <AlertCircle className="size-3 shrink-0" />
                      Ce parcours ne contient aucun module et ne peut pas être publié dans la
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
