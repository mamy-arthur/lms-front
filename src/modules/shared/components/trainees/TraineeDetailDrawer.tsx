'use client';

import { useState, type ComponentType } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { User } from '@/modules/admin/resources/users/types';
import { ACCESS } from '@/shared/auth/permissions';
import { useUserQueryScope } from '@/shared/hooks/useUserQueryScope';
import type { TraineeDetailArea } from '@/shared/types/trainee-detail.types';
import { TraineeDetailPage } from './TraineeDetailPage';

export interface TraineeEditFormProps {
  open: boolean;
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
  onSuccess?: () => void;
  user?: User;
}

interface Props {
  id: string | null;
  area: TraineeDetailArea;
  /** Injected by each area so this module stays free of admin and portal imports. */
  editForm: ComponentType<TraineeEditFormProps>;
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}

export function TraineeDetailDrawer(props: Props) {
  const scope = useUserQueryScope('trainee-detail', ACCESS.users.anyRoles);
  if (!scope.enabled) return null;
  return <TraineeDrawers key={JSON.stringify([...scope.key, props.area])} {...props} />;
}

function TraineeDrawers({ id, area, editForm: EditForm, onClose, onCloseAutoFocus }: Props) {
  const scope = useUserQueryScope('trainee-detail', ACCESS.users.anyRoles);
  const client = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [previousId, setPreviousId] = useState(id);
  if (previousId !== id) {
    setPreviousId(id);
    if (id !== null) setEditingUser(null);
  }
  const edit = (user: User) => {
    setEditingUser(user);
    onClose();
  };
  const closeEdit = () => setEditingUser(null);
  const saved = () => {
    if (editingUser)
      void client.invalidateQueries({ queryKey: [...scope.key, area, editingUser.id] });
    closeEdit();
  };
  const editProps = {
    open: editingUser !== null && id === null,
    onClose: closeEdit,
    onCloseAutoFocus,
    onSuccess: saved,
    user: editingUser ?? undefined,
  };

  return (
    <>
      <Sheet open={id !== null && editingUser === null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          onCloseAutoFocus={(event) => {
            if (editingUser) event.preventDefault();
            else onCloseAutoFocus?.(event);
          }}
          className="w-full! max-w-none! gap-0 bg-background p-0 sm:w-[60vw]!"
        >
          <SheetHeader className="shrink-0 border-b px-4 py-4 pr-14 sm:px-6">
            <SheetTitle>Détail du stagiaire</SheetTitle>
            <SheetDescription>Profil et suivi des formations du stagiaire.</SheetDescription>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-4 right-4"
                aria-label="Fermer le détail du stagiaire"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </SheetClose>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
            {id && <TraineeDetailPage id={id} area={area} onEdit={edit} />}
          </div>
        </SheetContent>
      </Sheet>
      {editingUser && <EditForm {...editProps} />}
    </>
  );
}
