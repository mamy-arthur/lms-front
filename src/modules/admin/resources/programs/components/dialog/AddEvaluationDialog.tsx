'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEvaluationQuery } from '../../hooks/useEvaluationQuery';
import { useQuestionPoolCheck } from '../../hooks/useQuestionPoolCheck';
import { AlertTriangle, Award, Check, ClipboardCheck, Loader2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/lib/cn';
import { Separator } from '@/components/ui/separator';
import { useQuizzesQuery } from '@/modules/admin/resources/quizzes/hooks/useQuizzesQuery';
import { Switch } from '@/components/ui/switch';
import {
  isValidEvaluationTimeLimit,
  MAX_EVALUATION_TIME_LIMIT_MINUTES,
} from '../../lib/evaluation-time-limit';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvalStepType = 'evaluation-intermediate' | 'evaluation-final';

export type EvaluationConfig = {
  stepType: EvalStepType;
  title: string;
  timeLimitMinutes: number | null;
  questionCount: number;
  attemptCount: number;
  questionBankIds: string[];
  questionBankNames: string[];
};

type QuestionBank = {
  id: string;
  name: string;
  description?: string;
};

const DEFAULT_CONFIG: EvaluationConfig = {
  stepType: 'evaluation-intermediate',
  title: '',
  timeLimitMinutes: null,
  questionCount: 20,
  attemptCount: 1,
  questionBankIds: [],
  questionBankNames: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasFinalEval: boolean;
  hasPartialForLastModule?: boolean;
  initialConfig?: EvaluationConfig;
  evaluationId?: string;
  alreadyUsedBankIds?: string[];
  learningPathId: string;
  /** competency_id of the module just before the node — for intermediate evaluations */
  precedingModuleId?: string;
  /** competency_ids of all modules already present in the learning path — for final evaluations */
  allModuleIds: string[];
  moduleNameById: Record<string, string>;
  onConfirm: (config: EvaluationConfig) => void;
  /** Consultation only — used when the learning path is locked */
  readOnly?: boolean;
};

export function AddEvaluationDialog({
  open,
  onOpenChange,
  hasFinalEval,
  hasPartialForLastModule = false,
  initialConfig,
  evaluationId,
  alreadyUsedBankIds = [],
  learningPathId,
  precedingModuleId,
  allModuleIds,
  moduleNameById,
  onConfirm,
  readOnly = false,
}: Props) {
  const [config, setConfig] = useState<EvaluationConfig>(initialConfig ?? DEFAULT_CONFIG);
  const [bankSearch, setBankSearch] = useState('');

  const { data: banksRaw, isLoading: isLoadingBanks } = useQuizzesQuery();

  const { data: evalDetail, isLoading: isLoadingDetail } = useEvaluationQuery(
    open ? evaluationId : null,
  );

  const questionBanks = useMemo(
    () =>
      (banksRaw?.data ?? []).map<QuestionBank>((b) => ({
        id: b.id,
        name: b.title,
        description: b.description ?? undefined,
      })),
    [banksRaw],
  );

  useEffect(() => {
    if (open) {
      const base = initialConfig ?? DEFAULT_CONFIG;
      setConfig(
        !initialConfig && hasPartialForLastModule
          ? { ...base, stepType: 'evaluation-final' as EvalStepType }
          : base,
      );
      setBankSearch('');
    }
  }, [open]);

  // Pre-populate selected banks from API only as a fallback when initialConfig
  // didn't already provide them (prevents evalDetail refetches from overriding
  // user selections in-progress).
  useEffect(() => {
    if (open && evalDetail && !initialConfig?.questionBankIds?.length) {
      setConfig((c) => ({
        ...c,
        questionBankIds: evalDetail.data.question_bank_ids,
      }));
    }
  }, [open, evalDetail]);

  const set = <K extends keyof EvaluationConfig>(key: K, val: EvaluationConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: val }));

  const allBankIds = useMemo(() => questionBanks.map((b) => b.id), [questionBanks]);

  // For edit mode, preceding module comes from the stored evaluation data
  const effectivePrecedingModuleId = evaluationId
    ? (evalDetail?.data.preceding_competency_id ?? undefined)
    : precedingModuleId;

  const effectiveModuleIds = useMemo(() => {
    if (config.stepType === 'evaluation-intermediate') {
      return effectivePrecedingModuleId ? [effectivePrecedingModuleId] : [];
    }
    return allModuleIds;
  }, [config.stepType, effectivePrecedingModuleId, allModuleIds]);

  const precedingModuleName = effectivePrecedingModuleId
    ? moduleNameById[effectivePrecedingModuleId]
    : undefined;

  const moduleScopeLabel =
    config.stepType === 'evaluation-intermediate'
      ? 'pour ce module'
      : 'pour les modules sélectionnés';

  const {
    data: poolData,
    isLoading: isLoadingPool,
    isError: isErrorPool,
  } = useQuestionPoolCheck(learningPathId, allBankIds, effectiveModuleIds);

  const bankCounts = poolData?.by_bank ?? {};
  const poolChecked = effectiveModuleIds.length > 0 && !isLoadingPool && poolData !== undefined;

  // When pool data updates, auto-deselect any bank that no longer has available questions
  useEffect(() => {
    if (!poolChecked || readOnly) return;
    const availableIds = new Set(
      Object.entries(poolData.by_bank)
        .filter(([, counts]) => counts.available > 0)
        .map(([bankId]) => bankId),
    );
    setConfig((c) => {
      const validIds = c.questionBankIds.filter((id) => availableIds.has(id));
      if (validIds.length === c.questionBankIds.length) return c;
      return {
        ...c,
        questionBankIds: validIds,
        questionBankNames: c.questionBankNames.filter((_, i) =>
          availableIds.has(c.questionBankIds[i]),
        ),
      };
    });
  }, [poolData]);

  const filteredBanks = useMemo(() => {
    const bySearch = questionBanks.filter((b) =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase()),
    );
    // Consultation : seules les banques rattachées à l'évaluation sont pertinentes
    if (readOnly) {
      return bySearch.filter((b) => config.questionBankIds.includes(b.id));
    }
    // Once pool data arrives, only surface banks with at least one available question
    if (poolChecked) {
      return bySearch.filter((b) => (bankCounts[b.id]?.available ?? 0) > 0);
    }
    return bySearch;
  }, [questionBanks, bankSearch, poolChecked, bankCounts, readOnly, config.questionBankIds]);

  const selectedAvailable = config.questionBankIds.reduce(
    (sum, id) => sum + (bankCounts[id]?.available ?? 0),
    0,
  );
  // Le pool doit couvrir le nombre de questions configuré, pas seulement être non-nul
  const poolInsufficient =
    !readOnly &&
    config.questionBankIds.length > 0 &&
    poolChecked &&
    selectedAvailable < config.questionCount;

  // Le type d'évaluation est figé dès qu'elle existe : le modifier changerait sa portée
  const stepTypeLocked = readOnly || initialConfig !== undefined;

  const canSubmit =
    config.title.trim() !== '' &&
    config.questionBankIds.length > 0 &&
    isValidEvaluationTimeLimit(config.timeLimitMinutes) &&
    !(hasPartialForLastModule && config.stepType === 'evaluation-intermediate') &&
    !poolInsufficient;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {config.stepType === 'evaluation-intermediate'
              ? `Configurer l’évaluation du module «${precedingModuleName ? ` ${precedingModuleName}` : ''}»`
              : 'Configurer l’évaluation de tous les modules du nœud'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Parcours verrouillé : l’évaluation est consultable mais ne peut plus être modifiée.'
              : "Définissez les paramètres de l'évaluation à ajouter au parcours"}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto overflow-x-hidden pr-1">
          {/* ── Title ── */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="eval-title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="eval-title"
              placeholder="Ex. : Évaluation intermédiaire — Module 1"
              value={config.title}
              disabled={readOnly}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* ── Type ── */}
          <div className="flex flex-col space-y-2">
            <Label>Type d'évaluation</Label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={stepTypeLocked || hasPartialForLastModule}
                onClick={() =>
                  !stepTypeLocked &&
                  !hasPartialForLastModule &&
                  set('stepType', 'evaluation-intermediate')
                }
                className={cn(
                  'flex flex-1 items-center gap-2.5 rounded-lg border p-3 text-left transition-colors',
                  config.stepType === 'evaluation-intermediate' && !hasPartialForLastModule
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-border bg-card hover:bg-muted/50',
                  (stepTypeLocked || hasPartialForLastModule) && 'cursor-not-allowed',
                  hasPartialForLastModule && !stepTypeLocked && 'opacity-50',
                )}
              >
                <ClipboardCheck className="size-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Intermédiaire</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {hasPartialForLastModule && !stepTypeLocked
                      ? 'Seule une évaluation finale est disponible'
                      : 'Évaluation en cours de parcours'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={stepTypeLocked || hasFinalEval}
                onClick={() =>
                  !stepTypeLocked && !hasFinalEval && set('stepType', 'evaluation-final')
                }
                className={cn(
                  'flex flex-1 items-center gap-2.5 rounded-lg border p-3 text-left transition-colors',
                  config.stepType === 'evaluation-final'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-border bg-card hover:bg-muted/50',
                  (stepTypeLocked || hasFinalEval) && 'cursor-not-allowed',
                  hasFinalEval && !stepTypeLocked && 'opacity-50',
                )}
              >
                <Award className="size-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Finale</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {hasFinalEval && !stepTypeLocked
                      ? 'Déjà ajoutée au parcours'
                      : 'Évaluation de fin de parcours'}
                  </p>
                </div>
              </button>
            </div>
            {stepTypeLocked && !readOnly && (
              <p className="text-[11px] text-muted-foreground">
                Le type d&apos;une évaluation existante ne peut pas être modifié.
              </p>
            )}
          </div>

          {/* ── Duration ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sw-duration">Limiter le temps de l’évaluation</Label>
              <Switch
                id="sw-duration"
                checked={config.timeLimitMinutes !== null}
                onCheckedChange={(enabled) => set('timeLimitMinutes', enabled ? 30 : null)}
                className="data-[state=checked]:bg-(--color-primary)"
              />
            </div>
            {config.timeLimitMinutes !== null ? (
              <div className="space-y-2">
                <Label htmlFor="eval-time-limit">Durée maximale (minutes)</Label>
                <Input
                  id="eval-time-limit"
                  type="number"
                  min={1}
                  max={MAX_EVALUATION_TIME_LIMIT_MINUTES}
                  step={1}
                  value={Number.isFinite(config.timeLimitMinutes) ? config.timeLimitMinutes : ''}
                  onChange={(e) => set('timeLimitMinutes', e.target.valueAsNumber)}
                  aria-invalid={!isValidEvaluationTimeLimit(config.timeLimitMinutes)}
                  aria-describedby="eval-time-limit-help"
                  className="w-40"
                />
                <p
                  id="eval-time-limit-help"
                  className={cn(
                    'text-xs',
                    isValidEvaluationTimeLimit(config.timeLimitMinutes)
                      ? 'text-muted-foreground'
                      : 'text-destructive',
                  )}
                >
                  Saisissez un nombre entier de minutes entre 1 et 2147483647 (ex. : 90).
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sans limite de temps.</p>
            )}
          </div>

          {/* ── Params ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="q-count">Nombre de questions</Label>
              <Input
                id="q-count"
                type="number"
                min={1}
                disabled={readOnly}
                value={config.questionCount}
                onChange={(e) => set('questionCount', Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="a-count">Nombre de tentatives</Label>
              <Input
                id="a-count"
                type="number"
                min={1}
                disabled={readOnly}
                value={config.attemptCount}
                onChange={(e) => set('attemptCount', Number(e.target.value))}
              />
            </div>
          </div>

          {/* ── Question bank ── */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Banques de questions <span className="text-destructive">*</span>
              </Label>
              {config.questionBankIds.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {config.questionBankIds.length} sélectionnée
                  {config.questionBankIds.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une banque…"
                value={bankSearch}
                disabled={readOnly}
                onChange={(e) => setBankSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto overflow-x-hidden pr-1">
              {isLoadingBanks || isLoadingDetail ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : isErrorPool && !readOnly ? (
                <p className="py-4 text-center text-xs text-destructive">
                  Impossible de vérifier les questions disponibles. Réessayez.
                </p>
              ) : !readOnly && isLoadingPool && effectiveModuleIds.length > 0 ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredBanks.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  {readOnly
                    ? 'Aucune banque de questions associée à cette évaluation.'
                    : questionBanks.length === 0
                      ? 'Aucune banque de questions disponible.'
                      : poolChecked
                        ? 'Aucune banque ne contient de questions pour les modules concernés.'
                        : 'Aucune banque ne correspond à votre recherche.'}
                </p>
              ) : (
                filteredBanks.map((bank) => {
                  const isSelected = config.questionBankIds.includes(bank.id);
                  const counts = bankCounts[bank.id];
                  return (
                    <button
                      key={bank.id}
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        setConfig((c) => {
                          if (c.questionBankIds.includes(bank.id)) {
                            const idx = c.questionBankIds.indexOf(bank.id);
                            return {
                              ...c,
                              questionBankIds: c.questionBankIds.filter((id) => id !== bank.id),
                              questionBankNames: c.questionBankNames.filter((_, i) => i !== idx),
                            };
                          }
                          return {
                            ...c,
                            questionBankIds: [...c.questionBankIds, bank.id],
                            questionBankNames: [...c.questionBankNames, bank.name],
                          };
                        });
                      }}
                      className={cn(
                        'flex items-start justify-between rounded-lg border p-3 text-left transition-colors',
                        isSelected
                          ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border bg-card hover:border-(--color-primary)',
                        readOnly && 'cursor-default hover:border-border',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">{bank.name}</p>
                        {bank.description && (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                            {bank.description}
                          </p>
                        )}
                        {counts !== undefined && (
                          <div className="mt-1.5 flex gap-3">
                            <span className="text-[10px] text-muted-foreground">
                              Existantes :{' '}
                              <strong className="text-foreground">{counts.total}</strong>
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Disponibles {moduleScopeLabel} :{' '}
                              <strong className="text-foreground">{counts.available}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                      {!isSelected && alreadyUsedBankIds.includes(bank.id) && (
                        <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          Déjà ajoutée
                        </span>
                      )}
                      {isSelected && <Check className="ml-2 mt-0.5 size-4 shrink-0 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* ── No-questions warning for selected banks ── */}
            {poolInsufficient && (
              <div className="mt-1 flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                <span>
                  {selectedAvailable} question{selectedAvailable !== 1 ? 's' : ''} disponible
                  {selectedAvailable !== 1 ? 's' : ''} pour les modules concernés dans les banques
                  sélectionnées, pour {config.questionCount} demandée
                  {config.questionCount !== 1 ? 's' : ''}. Réduisez le nombre de questions ou
                  sélectionnez d'autres banques.
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {readOnly ? 'Fermer' : 'Annuler'}
          </Button>
          {!readOnly && (
            <Button
              disabled={!canSubmit}
              onClick={() => {
                onConfirm(config);
                onOpenChange(false);
              }}
              className="bg-(--color-primary) hover:bg-(--color-primary)/80"
            >
              <Plus />
              {initialConfig ? "Modifier l'évaluation" : "Ajouter l'évaluation"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
