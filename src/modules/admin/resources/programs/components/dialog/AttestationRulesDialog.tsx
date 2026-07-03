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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/shared/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttestationRules = {
  avgScore: boolean;
  avgScoreMin: number;
  finalScore: boolean;
  finalScoreMin: number;
  noRule: boolean;
  retake: boolean;
  retakeTargetNodeId: string | null;
};

export type NodeOption = {
  id: string;
  label: string;
  stepType: 'module' | 'evaluation-intermediate' | 'evaluation-final';
};

const DEFAULT_RULES: AttestationRules = {
  avgScore: false,
  avgScoreMin: 10,
  finalScore: false,
  finalScoreMin: 10,
  noRule: false,
  retake: false,
  retakeTargetNodeId: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRules?: AttestationRules;
  nodeOptions: NodeOption[];
  onSave: (rules: AttestationRules) => void;
};

export function AttestationRulesDialog({
  open,
  onOpenChange,
  initialRules,
  nodeOptions,
  onSave,
}: Props) {
  const [rules, setRules] = useState<AttestationRules>(initialRules ?? DEFAULT_RULES);

  useEffect(() => {
    if (open) setRules(initialRules ?? DEFAULT_RULES);
  }, [open, initialRules]);

  const set = <K extends keyof AttestationRules>(key: K, val: AttestationRules[K]) =>
    setRules((r) => ({ ...r, [key]: val }));

  // Only one obtention rule can be active at a time
  const selectRule = (rule: 'avgScore' | 'finalScore' | 'noRule') =>
    setRules((r) => ({
      ...r,
      avgScore: rule === 'avgScore',
      finalScore: rule === 'finalScore',
      noRule: rule === 'noRule',
      // clear retake when noRule selected
      retake: rule === 'noRule' ? false : r.retake,
      retakeTargetNodeId: rule === 'noRule' ? null : r.retakeTargetNodeId,
    }));

  const canRetake = rules.avgScore || rules.finalScore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Règles d'obtention de l'attestation</DialogTitle>
          <DialogDescription>
            Définissez les conditions requises pour obtenir l'attestation.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-5">
          {/* ── Obtention rules ── */}
          <section className="space-y-3">
            <p className="font-semibold text-foreground">Règles d'obtention</p>

            {/* Average score */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="att-avg"
                  checked={rules.avgScore}
                  onCheckedChange={() => selectRule('avgScore')}
                  className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                />
                <span>Moyenne des évaluations supérieure ou égale à une valeur définie</span>
              </div>
              {rules.avgScore && (
                <div className="ml-6 flex items-center gap-2">
                  <Label htmlFor="att-avg-val" className="text-muted-foreground">
                    Valeur minimale
                  </Label>
                  <Input
                    id="att-avg-val"
                    type="number"
                    min={0}
                    value={rules.avgScoreMin}
                    onChange={(e) => set('avgScoreMin', Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              )}
            </div>

            {/* Final score */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="att-final"
                  checked={rules.finalScore}
                  onCheckedChange={() => selectRule('finalScore')}
                  className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                />
                <span>Note de l'évaluation finale supérieure ou égale à une valeur définie</span>
              </div>
              {rules.finalScore && (
                <div className="ml-6 flex items-center gap-2">
                  <Label htmlFor="att-final-val" className="text-muted-foreground">
                    Valeur minimale
                  </Label>
                  <Input
                    id="att-final-val"
                    type="number"
                    min={0}
                    value={rules.finalScoreMin}
                    onChange={(e) => set('finalScoreMin', Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              )}
            </div>

            {/* No rule */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="att-norule"
                checked={rules.noRule}
                onCheckedChange={() => selectRule('noRule')}
                className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
              />
              <span>Aucune règle (attestation toujours obtenue)</span>
            </div>
          </section>

          {/* ── Failure section ── */}
          <section className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold text-foreground">En cas d'échec</p>

            <div className="flex items-start gap-2">
              <Checkbox
                id="att-retake"
                checked={rules.retake}
                disabled={!canRetake}
                onCheckedChange={(v) => {
                  set('retake', !!v);
                  if (!v) set('retakeTargetNodeId', null);
                }}
                className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
              />
              <span className={!canRetake ? 'text-muted-foreground' : ''}>Faire repasser</span>
            </div>

            {rules.retake && (
              <div className="space-y-2">
                <div className="max-h-44 grid grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                  {nodeOptions.map((opt) => {
                    const isSelected = rules.retakeTargetNodeId === opt.id;
                    const badge =
                      opt.stepType === 'module'
                        ? {
                            label: 'Module',
                            badgeCls: 'border-blue-200 bg-blue-100 text-blue-700',
                            cardCls: 'border-blue-200 bg-blue-50/60 hover:bg-blue-50',
                            selectedCls: 'border-blue-400 bg-blue-100',
                          }
                        : opt.stepType === 'evaluation-intermediate'
                          ? {
                              label: 'Intermédiaire',
                              badgeCls: 'border-amber-200 bg-amber-100 text-amber-700',
                              cardCls: 'border-amber-200 bg-amber-50/60 hover:bg-amber-50',
                              selectedCls: 'border-amber-400 bg-amber-100',
                            }
                          : {
                              label: 'Finale',
                              badgeCls: 'border-red-200 bg-red-100 text-red-700',
                              cardCls: 'border-red-200 bg-red-50/60 hover:bg-red-50',
                              selectedCls: 'border-red-400 bg-red-100',
                            };
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => set('retakeTargetNodeId', opt.id)}
                        className={cn(
                          'flex items-center justify-between rounded-lg border p-2.5 text-left transition-colors',
                          isSelected ? badge.selectedCls : badge.cardCls,
                        )}
                      >
                        <span className="text-xs font-medium">{opt.label}</span>
                        <Badge variant="outline" className={cn('text-[10px]', badge.badgeCls)}>
                          {badge.label}
                        </Badge>
                      </button>
                    );
                  })}
                  {nodeOptions.length === 0 && (
                    <p className="py-3 text-center text-xs text-muted-foreground">
                      Aucun nœud disponible.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              onSave(rules);
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
