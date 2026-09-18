'use client';

import { AlertTriangle, CheckCircle2, History, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { FormationExecution } from '../lib/types';

interface Props {
  execution: FormationExecution;
  /** Progression du chemin actif, en pourcentage. */
  activeProgressPercent: number;
  /** Motif d'échec renvoyé par le backend, quand il est connu. */
  failureReason?: string | null;
  /** Le nœud courant impose une nouvelle visite malgré une preuve historique. */
  requiresRepeat?: boolean;
}

/**
 * État d'exécution de l'inscription.
 *
 * `progress` (chemin actif) et `coverage` (historique cumulé) sont deux
 * projections distinctes : 100 % de couverture peut coexister avec une
 * obligation de rejouer un module, voire avec un parcours en échec. Les afficher
 * séparément évite de laisser croire qu'un module déjà vu est acquis.
 */
export default function ExecutionStatusBanner({
  execution,
  activeProgressPercent,
  failureReason,
  requiresRepeat = false,
}: Props) {
  const { status, coveragePercent, completedCounts } = execution;

  return (
    <div className="flex flex-col gap-2 px-3 pb-2">
      {status === 'failed' && (
        <Alert variant="destructive" className="border-red-200">
          <AlertTriangle />
          <AlertTitle>Parcours en échec</AlertTitle>
          <AlertDescription>
            {failureReason ??
              'Vous avez épuisé les tentatives autorisées et aucune voie de secours n’est prévue.'}
          </AlertDescription>
        </Alert>
      )}

      {status === 'completed' && (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Parcours terminé</AlertTitle>
          <AlertDescription>
            Votre historique reste consultable, mais il n’est plus modifiable.
          </AlertDescription>
        </Alert>
      )}

      {status === 'expired' && (
        <Alert variant="destructive" className="border-red-200">
          <Clock />
          <AlertTitle>Inscription expirée</AlertTitle>
          <AlertDescription>
            La période d’accès est terminée : plus aucune progression ne peut être enregistrée.
          </AlertDescription>
        </Alert>
      )}

      {requiresRepeat && !execution.terminal && (
        <Alert>
          <History />
          <AlertTitle>Nouveau passage requis</AlertTitle>
          <AlertDescription>
            Ce module a déjà été suivi, mais votre parcours vous y ramène : il doit être refait pour
            continuer.
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-slate-500">
        Progression du parcours en cours :{' '}
        <span className="font-semibold text-slate-700">{activeProgressPercent}%</span> · Couverture
        historique : <span className="font-semibold text-slate-700">{coveragePercent}%</span> (
        {completedCounts.historical} unité{completedCounts.historical > 1 ? 's' : ''} déjà vue
        {completedCounts.historical > 1 ? 's' : ''})
      </p>
    </div>
  );
}
