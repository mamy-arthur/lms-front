'use client';

import { AlertTriangle, CheckCircle2, History, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { FormationExecution } from '../lib/types';

interface Props {
  execution: FormationExecution;
  /** Motif d'échec renvoyé par le backend, quand il est connu. */
  failureReason?: string | null;
  /** Le nœud courant impose une nouvelle visite malgré une preuve historique. */
  requiresRepeat?: boolean;
}

/** Alertes d'état de l'inscription et obligation de repassage. */
export default function ExecutionStatusBanner({
  execution,
  failureReason,
  requiresRepeat = false,
}: Props) {
  const { status } = execution;

  if (
    status !== 'failed' &&
    status !== 'completed' &&
    status !== 'expired' &&
    !(requiresRepeat && !execution.terminal)
  ) {
    return null;
  }

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
    </div>
  );
}
