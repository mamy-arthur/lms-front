'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, ClipboardCheck, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvalStepType = 'evaluation-intermediate' | 'evaluation-final';

export type EvaluationConfig = {
  stepType: EvalStepType;
  durationEnabled: boolean;
  durationHours: number;
  durationMinutes: number;
  questionCount: number;
  attemptCount: number;
  questionBankId: string | null;
  questionBankName: string | null;
};

type QuestionBank = {
  id: string;
  name: string;
  questionCount: number;
  description?: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_QUESTION_BANKS: QuestionBank[] = [
  {
    id: 'qb1',
    name: 'JavaScript Avancé',
    questionCount: 120,
    description: 'Concepts avancés, closures, async/await',
  },
  {
    id: 'qb2',
    name: 'React & Hooks',
    questionCount: 85,
    description: 'useState, useEffect, useContext, hooks personnalisés',
  },
  {
    id: 'qb3',
    name: 'Docker & Kubernetes',
    questionCount: 60,
    description: 'Conteneurisation et orchestration',
  },
  {
    id: 'qb4',
    name: 'Gestion de projet Agile',
    questionCount: 75,
    description: 'Scrum, Kanban, user stories, estimations',
  },
  {
    id: 'qb5',
    name: 'SQL & NoSQL',
    questionCount: 95,
    description: 'Requêtes, modélisation, indexation',
  },
  {
    id: 'qb6',
    name: 'Sécurité web (OWASP)',
    questionCount: 50,
    description: 'XSS, CSRF, injections SQL, bonnes pratiques',
  },
];

const DEFAULT_CONFIG: EvaluationConfig = {
  stepType: 'evaluation-intermediate',
  durationEnabled: false,
  durationHours: 0,
  durationMinutes: 30,
  questionCount: 20,
  attemptCount: 1,
  questionBankId: null,
  questionBankName: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasFinalEval: boolean;
  initialConfig?: EvaluationConfig;
  onConfirm: (config: EvaluationConfig) => void;
};

export function AddEvaluationDialog({ open, onOpenChange, hasFinalEval, initialConfig, onConfirm }: Props) {
  const [config, setConfig] = useState<EvaluationConfig>(initialConfig ?? DEFAULT_CONFIG);
  const [bankSearch, setBankSearch] = useState('');

  useEffect(() => {
    if (open) {
      setConfig(initialConfig ?? DEFAULT_CONFIG);
      setBankSearch('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof EvaluationConfig>(key: K, val: EvaluationConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: val }));

  const filteredBanks = useMemo(
    () =>
      MOCK_QUESTION_BANKS.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase())),
    [bankSearch],
  );

  const canSubmit = config.questionBankId !== null;

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
          {/* ── Type ── */}
          <div className="flex flex-col space-y-2">
            <Label>Type d'évaluation</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set('stepType', 'evaluation-intermediate')}
                className={cn(
                  'flex flex-1 items-center gap-2.5 rounded-lg border p-3 text-left transition-colors',
                  config.stepType === 'evaluation-intermediate'
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-border bg-card hover:bg-muted/50',
                )}
              >
                <ClipboardCheck className="size-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Intermédiaire</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Évaluation en cours de parcours
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
            <Label>
              Banque de questions <span className="text-destructive">*</span>
            </Label>
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
              {filteredBanks.map((bank) => {
                const isSelected = config.questionBankId === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => {
                      set('questionBankId', bank.id);
                      set('questionBankName', bank.name);
                    }}
                    className={cn(
                      'flex items-start justify-between rounded-lg border  p-3 text-left transition-colors',
                      isSelected
                        ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border bg-card hover:border-(--color-primary)',
                    )}
                  >
                    <div>
                      <p className="text-xs font-semibold">{bank.name}</p>
                      {bank.description && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {bank.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">
                      {bank.questionCount} questions
                    </Badge>
                  </button>
                );
              })}
              {filteredBanks.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Aucune banque ne correspond à votre recherche.
                </p>
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
