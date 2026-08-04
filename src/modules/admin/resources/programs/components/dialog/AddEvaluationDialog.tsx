'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEvaluationQuery } from '../../hooks/useEvaluationQuery';
import { Award, Check, ClipboardCheck, Loader2, Plus, Search } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/shared/lib/cn';
import { Separator } from '@/components/ui/separator';
import { useQuizzesQuery } from '@/modules/admin/resources/quizzes/hooks/useQuizzesQuery';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvalStepType = 'evaluation-intermediate' | 'evaluation-final';

export type EvaluationConfig = {
  stepType: EvalStepType;
  title: string;
  durationEnabled: boolean;
  durationHours: number;
  durationMinutes: number;
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
  durationEnabled: false,
  durationHours: 0,
  durationMinutes: 30,
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
  onConfirm: (config: EvaluationConfig) => void;
};

export function AddEvaluationDialog({
  open,
  onOpenChange,
  hasFinalEval,
  hasPartialForLastModule = false,
  initialConfig,
  evaluationId,
  alreadyUsedBankIds = [],
  onConfirm,
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

  const filteredBanks = useMemo(
    () => questionBanks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase())),
    [questionBanks, bankSearch],
  );

  const canSubmit =
    config.title.trim() !== '' &&
    config.questionBankIds.length > 0 &&
    !(hasPartialForLastModule && config.stepType === 'evaluation-intermediate');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Configurer l'évaluation</DialogTitle>
          <DialogDescription>
            Définissez les paramètres de l'évaluation à ajouter au parcours
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-5">
          {/* ── Title ── */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="eval-title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="eval-title"
              placeholder="Ex. : Évaluation intermédiaire — Module 1"
              value={config.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* ── Type ── */}
          <div className="flex flex-col space-y-2">
            <Label>Type d'évaluation</Label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={hasPartialForLastModule}
                onClick={() =>
                  !hasPartialForLastModule && set('stepType', 'evaluation-intermediate')
                }
                className={cn(
                  'flex flex-1 items-center gap-2.5 rounded-lg border p-3 text-left transition-colors',
                  config.stepType === 'evaluation-intermediate' && !hasPartialForLastModule
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-border bg-card hover:bg-muted/50',
                  hasPartialForLastModule && 'cursor-not-allowed opacity-50',
                )}
              >
                <ClipboardCheck className="size-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Intermédiaire</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {hasPartialForLastModule
                      ? 'Seule une évaluation finale est disponible'
                      : 'Évaluation en cours de parcours'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={hasFinalEval}
                onClick={() => !hasFinalEval && set('stepType', 'evaluation-final')}
                className={cn(
                  'flex flex-1 items-center gap-2.5 rounded-lg border p-3 text-left transition-colors',
                  config.stepType === 'evaluation-final'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-border bg-card hover:bg-muted/50',
                  hasFinalEval && 'cursor-not-allowed opacity-50',
                )}
              >
                <Award className="size-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Finale</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {hasFinalEval ? 'Déjà ajoutée au parcours' : 'Évaluation de fin de parcours'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* ── Duration ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sw-duration">Activer la durée</Label>
              <Switch
                id="sw-duration"
                checked={config.durationEnabled}
                onCheckedChange={(v) => set('durationEnabled', v)}
                className="data-[state=checked]:bg-(--color-primary)"
              />
            </div>
            {config.durationEnabled && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={config.durationHours}
                    onChange={(e) => set('durationHours', Number(e.target.value))}
                    className="w-16 text-center"
                  />
                  <span className="text-xs text-muted-foreground">heures</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={config.durationMinutes}
                    onChange={(e) => set('durationMinutes', Number(e.target.value))}
                    className="w-16 text-center"
                  />
                  <span className="text-xs text-muted-foreground">minutes</span>
                </div>
              </div>
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
                onChange={(e) => setBankSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
              {isLoadingBanks || isLoadingDetail ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredBanks.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  {questionBanks.length === 0
                    ? 'Aucune banque de questions disponible.'
                    : 'Aucune banque ne correspond à votre recherche.'}
                </p>
              ) : (
                filteredBanks.map((bank) => {
                  const isSelected = config.questionBankIds.includes(bank.id);
                  return (
                    <button
                      key={bank.id}
                      disabled={alreadyUsedBankIds.includes(bank.id)}
                      type="button"
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
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">{bank.name}</p>
                        {bank.description && (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                            {bank.description}
                          </p>
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
