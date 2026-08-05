'use client';

import { useCallback, useState } from 'react';
import { ConfirmDialog } from '@/shared/components/confirm-dialog/ConfirmDialog';

interface DeletableItem {
  id: string;
  full_name?: string;
  first_name: string;
  last_name: string;
}

export function useDeleteConfirm(onDelete: (id: string) => void) {
  const [target, setTarget] = useState<DeletableItem | null>(null);

  const openConfirm = useCallback((item: DeletableItem) => setTarget(item), []);

  const dialog = (
    <ConfirmDialog
      open={target !== null}
      title="Supprimer l'utilisateur"
      description={
        target
          ? `Êtes-vous sûr de vouloir supprimer « ${target.full_name || `${target.first_name} ${target.last_name}`.trim()} » ? Cette action est irréversible.`
          : undefined
      }
      confirmLabel="Supprimer"
      confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      onClose={() => setTarget(null)}
      onConfirm={() => {
        if (target) {
          onDelete(target.id);
          setTarget(null);
        }
      }}
    />
  );

  return { openConfirm, dialog } as const;
}
