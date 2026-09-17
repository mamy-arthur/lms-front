'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FormationNode } from '../lib/types';

interface Props {
  score: number;
  passingScore: number;
  /** Nœud que le moteur rend actionable après l'échec ; `null` si le parcours est terminé. */
  target: FormationNode | null;
  remainingAttempts: number | null;
  onConfirm: () => void;
}

/**
 * Annonce l'échec et l'étape imposée par le moteur.
 *
 * La cible vient du serveur : après un échec, la transition peut renvoyer sur un
 * module à refaire comme sur l'évaluation elle-même. Le frontend nomme ce que le
 * snapshot désigne, il ne rejoue pas la règle.
 */
export default function EvaluationFailureDialog({
  score,
  passingScore,
  target,
  remainingAttempts,
  onConfirm,
}: Props) {
  const isModule = target?.type === 'module';
  const action = isModule ? 'Revoir le module' : 'Repasser l’évaluation';

  return (
    <Dialog open onOpenChange={(open) => !open && onConfirm()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="size-5 text-amber-600" />
          </div>
          <DialogTitle>Évaluation non validée</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                Vous avez obtenu <span className="font-semibold text-slate-900">{score}%</span>, en
                dessous du seuil requis de {passingScore}%.
              </p>
              {target ? (
                <p>
                  Votre parcours vous ramène {isModule ? 'au module' : 'à l’évaluation'}{' '}
                  <span className="font-semibold text-slate-900">{target.title}</span>
                  {isModule ? ', à refaire avant de poursuivre.' : ', à repasser.'}
                </p>
              ) : (
                <p>Votre parcours a été mis à jour.</p>
              )}
              {remainingAttempts !== null && (
                <p>
                  Il vous reste{' '}
                  <span className="font-semibold text-slate-900">{remainingAttempts}</span>{' '}
                  tentative{remainingAttempts > 1 ? 's' : ''}.
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onConfirm} className="w-full gap-2 sm:w-auto">
            <RotateCcw className="size-4" />
            {target ? action : 'Continuer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
