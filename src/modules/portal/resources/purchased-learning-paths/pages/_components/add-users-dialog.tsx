'use client';

import { Search, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/shared/lib/date';
import { getInitials } from '@/shared/lib/string/getInitials';
import type { PurchasedLearningPathLearner } from '../../types';

// ── Component ─────────────────────────────────────────────────────────────────

interface AddUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allUsers: PurchasedLearningPathLearner[];
  initialSelectedIds?: Set<string>;
  enrolledAtMap?: Map<string, string>;
  onConfirm: (userIds: string[]) => void;
}

export function AddUsersDialog({
  open,
  onOpenChange,
  allUsers,
  initialSelectedIds,
  enrolledAtMap,
  onConfirm,
}: AddUsersDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedIds(new Set(initialSelectedIds));
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: snapshot on open only
  }, [open]);

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

  const handleConfirm = () => {
    if (selectedIds.size === 0) {
      toast.error('Sélectionnez au moins un utilisateur.');
      return;
    }
    onConfirm([...selectedIds]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Ajouter des utilisateurs</DialogTitle>
          <DialogDescription>
            Recherchez et sélectionnez les utilisateurs à ajouter à cette formation.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Rechercher un utilisateur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-72 px-5 pb-2 overflow-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs italic text-muted-foreground">
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
                      className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                    />
                    <Avatar className="size-7 shrink-0">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName} />
                      <AvatarFallback className="text-[10px] font-semibold">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{user.fullName}</p>
                      {user.email && (
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                    {enrolledAtMap?.has(user.id) && (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Inscrit le {formatDate(enrolledAtMap.get(user.id)!)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t px-5 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="gap-1.5 bg-(--color-primary) hover:bg-(--color-primary)/50 text-white"
          >
            <UserPlus className="size-4" />
            Ajouter{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
