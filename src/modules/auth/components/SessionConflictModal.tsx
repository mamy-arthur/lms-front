'use client';

import { useState } from 'react';
import { Loader2, Monitor, Globe, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ExistingSessionInfo } from '@/shared/api/auth.api';

interface Props {
  isOpen: boolean;
  existingSession: ExistingSessionInfo;
  replacementToken: string;
  onCancel: () => void;
  onConfirm: (replacementToken: string) => Promise<void>;
}

function formatActivityDate(iso: string): string {
  try {
    return format(new Date(iso), "d MMMM yyyy 'à' HH:mm", { locale: fr });
  } catch {
    return iso;
  }
}

export function SessionConflictModal({
  isOpen,
  existingSession,
  replacementToken,
  onCancel,
  onConfirm,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(replacementToken);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session déjà active</DialogTitle>
          <DialogDescription>
            Votre compte est actuellement connecté depuis un autre appareil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          {existingSession.deviceName && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Monitor className="h-3.5 w-3.5" />
                Appareil
              </span>
              <span className="font-medium">{existingSession.deviceName}</span>
            </div>
          )}
          {existingSession.browser && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                Navigateur
              </span>
              <span className="font-medium">{existingSession.browser}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Dernière activité
            </span>
            <span className="font-medium">
              {formatActivityDate(existingSession.lastActivityAt)}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          En confirmant, vous ouvrirez une session sur cet appareil et l&apos;ancienne session sera
          immédiatement fermée.
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion…
              </>
            ) : (
              'Me connecter sur cet appareil'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
