'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check } from 'lucide-react';
import type { ProgressionCondition } from '@/shared/types/progression-rule.types';

// ─── Public types ─────────────────────────────────────────────────────────────

export type NodeOption = {
  id: string;
  label: string;
  stepType: 'email' | 'module' | 'evaluation-intermediate' | 'evaluation-final';
};

export type ProgressionRuleFormData = {
  /** null means "deactivate / no rule" */
  condition: ProgressionCondition | null;
  failureTargetNodeId: string | null;
  maxAttempts: number | null;
  exhaustedTargetNodeId: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultCondition(sourceNodeType: 'module' | 'evaluation'): ProgressionCondition {
  return sourceNodeType === 'module'
    ? { type: 'module_completed', rule_type: 'any' }
    : { type: 'evaluation_completed' };
}

function conditionToRadioValue(condition: ProgressionCondition | null): string {
  if (!condition) return 'none';
  if (condition.type === 'module_completed') return `module_${condition.rule_type}`;
  if (condition.type === 'evaluation_passed') return 'evaluation_passed';
  return 'evaluation_completed';
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Type of the source (edge origin) node — determines which conditions are shown */
  sourceNodeType: 'module' | 'evaluation';
  /** Whether a rule already exists for this edge (shows the "no rule" deactivate option) */
  hasExistingRule: boolean;
  initialFormData?: ProgressionRuleFormData;
  /** Candidate nodes for failure-path / exhausted-path target selection */
  nodeOptions: NodeOption[];
  onSave: (data: ProgressionRuleFormData) => void;
};

export function ProgressionRuleDialog({
  open,
  onOpenChange,
  sourceNodeType,
  hasExistingRule,
  initialFormData,
  nodeOptions,
  onSave,
}: Props) {
  const [form, setForm] = useState<ProgressionRuleFormData>(() => ({
    condition: defaultCondition(sourceNodeType),
    failureTargetNodeId: null,
    maxAttempts: null,
    exhaustedTargetNodeId: null,
  }));

  // Re-populate when the dialog opens
  useEffect(() => {
    if (open) {
      setForm(
        initialFormData ?? {
          condition: defaultCondition(sourceNodeType),
          failureTargetNodeId: null,
          maxAttempts: null,
          exhaustedTargetNodeId: null,
        },
      );
    }
  }, [open, initialFormData, sourceNodeType]);

  // ── Helpers ──

  const setField = <K extends keyof ProgressionRuleFormData>(
    key: K,
    value: ProgressionRuleFormData[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleRadioChange = (value: string) => {
    if (value === 'none') {
      setForm((f) => ({
        ...f,
        condition: null,
        failureTargetNodeId: null,
        maxAttempts: null,
        exhaustedTargetNodeId: null,
      }));
      return;
    }
    if (value === 'module_any') {
      setField('condition', { type: 'module_completed', rule_type: 'any' });
      return;
    }
    if (value === 'module_all') {
      setField('condition', { type: 'module_completed', rule_type: 'all' });
      return;
    }
    if (value === 'evaluation_passed') {
      const prev = form.condition;
      const prevScore = prev?.type === 'evaluation_passed' ? prev.min_score_percentage : 50;
      setField('condition', { type: 'evaluation_passed', min_score_percentage: prevScore });
      return;
    }
    if (value === 'evaluation_completed') {
      setField('condition', { type: 'evaluation_completed' });
    }
  };

  const toggleFailurePath = (enabled: boolean) => {
    if (!enabled) {
      setForm((f) => ({
        ...f,
        failureTargetNodeId: null,
        maxAttempts: null,
        exhaustedTargetNodeId: null,
      }));
    } else {
      setField('failureTargetNodeId', nodeOptions[0]?.id ?? null);
    }
  };

  const hasFailurePath = form.failureTargetNodeId !== null;
  const hasMaxAttempts = form.maxAttempts !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Règle de progression</DialogTitle>
          <DialogDescription>
            Définissez la condition permettant de passer à l&apos;étape suivante.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-5">
          {/* ── Condition ── */}
          <section>
            <p className="mb-3 font-semibold text-foreground">Condition de passage</p>
            <RadioGroup
              value={conditionToRadioValue(form.condition)}
              onValueChange={handleRadioChange}
              className="space-y-2"
            >
              {sourceNodeType === 'module' && (
                <>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="module_any" id="cond-module-any" />
                    <Label htmlFor="cond-module-any" className="font-normal">
                      Au moins un cours du module complété
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="module_all" id="cond-module-all" />
                    <Label htmlFor="cond-module-all" className="font-normal">
                      Tous les cours du module complétés
                    </Label>
                  </div>
                </>
              )}

              {sourceNodeType === 'evaluation' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="evaluation_passed" id="cond-eval-passed" />
                      <Label htmlFor="cond-eval-passed" className="font-normal">
                        Évaluation réussie avec un score minimum
                      </Label>
                    </div>
                    {form.condition?.type === 'evaluation_passed' && (
                      <div className="ml-6 flex items-center gap-2">
                        <Label htmlFor="eval-score" className="text-sm text-muted-foreground">
                          Score minimum
                        </Label>
                        <Input
                          id="eval-score"
                          type="number"
                          min={0}
                          max={100}
                          value={form.condition.min_score_percentage}
                          onChange={(e) =>
                            setField('condition', {
                              type: 'evaluation_passed',
                              min_score_percentage: Math.min(
                                100,
                                Math.max(0, Number(e.target.value)),
                              ),
                            })
                          }
                          className="w-24"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="evaluation_completed" id="cond-eval-completed" />
                    <Label htmlFor="cond-eval-completed" className="font-normal">
                      Évaluation complétée (quel que soit le score)
                    </Label>
                  </div>
                </>
              )}

              {hasExistingRule && (
                <div className="flex items-center gap-2 pt-1">
                  <RadioGroupItem value="none" id="cond-none" />
                  <Label htmlFor="cond-none" className="font-normal text-muted-foreground">
                    Aucune règle (désactiver)
                  </Label>
                </div>
              )}
            </RadioGroup>
          </section>

          {/* ── Failure path ── */}
          {form.condition !== null && nodeOptions.length > 0 && (
            <section>
              <Separator className="mb-4" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">Chemin en cas d&apos;échec</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Rediriger le stagiaire vers un autre nœud si la condition n&apos;est pas
                    satisfaite
                  </p>
                </div>
                <Switch
                  checked={hasFailurePath}
                  onCheckedChange={toggleFailurePath}
                  aria-label="Activer le chemin d'échec"
                />
              </div>

              {hasFailurePath && (
                <div className="mt-4 space-y-4">
                  {/* Failure target */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Rediriger vers</Label>
                    <Select
                      value={form.failureTargetNodeId ?? ''}
                      onValueChange={(v) => setField('failureTargetNodeId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un nœud" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodeOptions.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Max attempts */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">
                      Nombre maximum de tentatives
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Illimité"
                        value={form.maxAttempts ?? ''}
                        onChange={(e) =>
                          setField(
                            'maxAttempts',
                            e.target.value ? Math.max(1, Number(e.target.value)) : null,
                          )
                        }
                        className="w-32"
                      />
                      <span className="text-xs text-muted-foreground">vide = illimité</span>
                    </div>
                  </div>

                  {/* Exhausted target — only shown when maxAttempts is set */}
                  {hasMaxAttempts && (
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">
                        Après épuisement des tentatives, rediriger vers
                      </Label>
                      <Select
                        value={form.exhaustedTargetNodeId ?? '_none_'}
                        onValueChange={(v) =>
                          setField('exhaustedTargetNodeId', v === '_none_' ? null : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">Aucun</SelectItem>
                          {nodeOptions.map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              onSave(form);
              onOpenChange(false);
            }}
            className="bg-(--color-primary) hover:bg-(--color-primary)/50"
          >
            <Check />
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
