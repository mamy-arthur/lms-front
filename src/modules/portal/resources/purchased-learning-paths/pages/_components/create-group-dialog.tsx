'use client';

import { Check, Loader2, Save, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInitials } from '@/shared/lib/string/getInitials';
import type { TenantAssignableUser } from '../../types';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allUsers: TenantAssignableUser[];
  onConfirm: (name: string, userIds: string[]) => void | Promise<void>;
  /** Pré-remplit le formulaire — active le mode édition. */
  initialName?: string;
  initialUserIds?: string[];
  isSubmitting?: boolean;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  allUsers,
  onConfirm,
  initialName,
  initialUserIds,
  isSubmitting = false,
}: CreateGroupDialogProps) {
  const isEditing = Boolean(initialName);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setGroupName(initialName ?? '');
      setSearch('');
      setSelectedIds(initialUserIds ? new Set(initialUserIds) : new Set());
    }
  }, [open, initialName, initialUserIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => u.fullName.toLowerCase().includes(q));
  }, [allUsers, search]);

  const toggleUser = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    const name = groupName.trim();
    if (!name) {
      toast.error('Le nom du groupe est obligatoire.');
      return;
    }
    if (selectedIds.size === 0) {
      toast.error('Sélectionnez au moins un membre.');
      return;
    }
    await onConfirm(name, [...selectedIds]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{isEditing ? 'Modifier le groupe' : 'Créer un groupe'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez le nom et les membres du groupe.'
              : 'Donnez un nom au groupe et sélectionnez ses membres.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 pt-4 pb-2">
          <div className="space-y-1.5">
            <Label htmlFor="create-group-name">Nom du groupe</Label>
            <Input
              id="create-group-name"
              placeholder="Ex : Équipe commerciale"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Membres</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Rechercher un utilisateur…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-60 px-5 pb-2 overflow-auto">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-xs italic text-muted-foreground">
              Aucun résultat pour cette recherche.
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((user) => {
                const checked = selectedIds.has(user.id);
                return (
                  <label
                    key={user.id}
                    htmlFor={user.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
                  >
                    <Checkbox
                      id={user.id}
                      checked={checked}
                      onCheckedChange={() => toggleUser(user.id)}
                      disabled={isSubmitting}
                      className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                    />
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback className="text-[10px] font-semibold">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{user.fullName}</span>
                    {checked && <Check className="ml-auto size-3.5 shrink-0 text-primary" />}
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {selectedIds.size > 0 && (
          <p className="px-5 pb-2 text-xs text-muted-foreground">
            {selectedIds.size} membre{selectedIds.size > 1 ? 's' : ''} sélectionné
            {selectedIds.size > 1 ? 's' : ''}
          </p>
        )}

        <DialogFooter className="border-t px-5 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={!groupName.trim() || selectedIds.size === 0 || isSubmitting}
            className="gap-1.5 bg-(--color-primary) hover:bg-(--color-primary)/50 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isEditing ? 'Enregistrer' : 'Créer le groupe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
