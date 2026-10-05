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
import type { User } from '@/shared/types/user.types';
import { ACCESS } from '@/shared/auth/permissions';
import { useUserQueryScope } from '@/shared/hooks/useUserQueryScope';
import type { UserDetailArea } from '@/shared/types/user-detail.types';

export interface UserDetailPageProps {
  id: string;
  area: UserDetailArea;
  onEdit: (user: User) => void;
}

export interface UserDetailEditFormProps {
  open: boolean;
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
  onSuccess?: () => void;
  user?: User;
}

export interface UserDetailDrawerProps {
  id: string | null;
  area: UserDetailArea;
  /** Each area injects its own form; shared details have no feature runtime imports. */
  editForm: ComponentType<UserDetailEditFormProps>;
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}

interface Props extends UserDetailDrawerProps {
  namespace: string;
  title: string;
  description: string;
  closeLabel: string;
  page: ComponentType<UserDetailPageProps>;
}

export function UserDetailDrawer(props: Props) {
  const scope = useUserQueryScope(props.namespace, ACCESS.users.anyRoles);
  if (!scope.enabled) return null;
  return <UserDrawers key={JSON.stringify([...scope.key, props.area])} {...props} />;
}

function UserDrawers({
  id,
  area,
  editForm: EditForm,
  onClose,
  onCloseAutoFocus,
  namespace,
  title,
  description,
  closeLabel,
  page: Page,
}: Props) {
  const scope = useUserQueryScope(namespace, ACCESS.users.anyRoles);
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
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-4 right-4"
                aria-label={closeLabel}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </SheetClose>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
            {id && <Page id={id} area={area} onEdit={edit} />}
          </div>
        </SheetContent>
      </Sheet>
      {editingUser && (
        <EditForm
          open={id === null}
          onClose={closeEdit}
          onCloseAutoFocus={onCloseAutoFocus}
          onSuccess={saved}
          user={editingUser}
        />
      )}
    </>
  );
}
