'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, UserPlus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type {
  AssignableGroup,
  PurchasedLearningPathRow,
  TenantAssignableUser,
} from '../../types';
import { AddUsersDialog } from './add-users-dialog';
import { CreateGroupDialog } from './create-group-dialog';
import { UserCard, GroupCard } from './cards';

interface PurchasedLearningPathAssignmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchasedLearningPath: PurchasedLearningPathRow | null;
  users: TenantAssignableUser[];
  groups: AssignableGroup[];
  onAssignUsers: (purchasedLearningPathId: string, userIds: string[]) => number;
  onAssignGroup: (purchasedLearningPathId: string, groupId: string) => number;
  onCreateGroup: (tenantId: string, name: string, userIds: string[]) => AssignableGroup;
  onEditGroup: (groupId: string, name: string, userIds: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
}

export function PurchasedLearningPathAssignmentDrawer({
  open,
  onOpenChange,
  purchasedLearningPath,
  users,
  groups,
  onAssignUsers,
  onAssignGroup,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
}: PurchasedLearningPathAssignmentDrawerProps) {
  const [pendingAddIds, setPendingAddIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [editingGroup, setEditingGroup] = useState<AssignableGroup | null>(null);

  const [showAddUsers, setShowAddUsers] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    if (!purchasedLearningPath || !open) return;
    setPendingAddIds(new Set());
    setSelectedGroupIds(new Set());
    setEditingGroup(null);
    setShowAddUsers(false);
    setShowCreateGroup(false);
  }, [purchasedLearningPath, open]);

  const enrolledUserIds = useMemo(
    () => new Set(purchasedLearningPath?.enrollments.map((e) => e.userId) ?? []),
    [purchasedLearningPath],
  );

  const availableToAdd = useMemo(
    () => users.filter((u) => !enrolledUserIds.has(u.id) && !pendingAddIds.has(u.id)),
    [users, enrolledUserIds, pendingAddIds],
  );

  if (!purchasedLearningPath) return null;

  const handleAddUsersConfirm = (userIds: string[]) => {
    setPendingAddIds((prev) => new Set([...prev, ...userIds]));
  };

  const handleCreateGroupConfirm = (name: string, userIds: string[]) => {
    const group = onCreateGroup(purchasedLearningPath.tenantId, name, userIds);
    setSelectedGroupIds((prev) => new Set([...prev, group.id]));
    toast.success(`Groupe "${group.name}" créé.`);
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleAssign = () => {
    if (pendingAddIds.size > 0) {
      onAssignUsers(purchasedLearningPath.id, [...pendingAddIds]);
    }

    let groupCount = 0;
    for (const groupId of selectedGroupIds) {
      groupCount += onAssignGroup(purchasedLearningPath.id, groupId);
    }

    const parts: string[] = [];
    if (pendingAddIds.size > 0) parts.push(`${pendingAddIds.size} utilisateur(s) ajouté(s)`);
    if (groupCount > 0) parts.push(`${groupCount} membre(s) de groupe assigné(s)`);

    if (parts.length === 0) {
      toast.info('Aucune modification à enregistrer.');
    } else {
      toast.success(parts.join(', ') + '.');
    }

    onOpenChange(false);
  };

  return (
    <>
      <AddUsersDialog
        open={showAddUsers}
        onOpenChange={setShowAddUsers}
        availableUsers={availableToAdd}
        onConfirm={handleAddUsersConfirm}
      />
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        allUsers={users}
        onConfirm={handleCreateGroupConfirm}
      />
      <CreateGroupDialog
        open={Boolean(editingGroup)}
        onOpenChange={(dialogOpen) => {
          if (!dialogOpen) setEditingGroup(null);
        }}
        allUsers={users}
        initialName={editingGroup?.name}
        initialUserIds={editingGroup?.userIds}
        onConfirm={(name, userIds) => {
          if (editingGroup) {
            onEditGroup(editingGroup.id, name, userIds);
            setEditingGroup(null);
          }
        }}
      />

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="flex w-full flex-col gap-0 p-0 max-w-225! overflow-auto"
          showCloseButton={true}
        >
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>Assigner — {purchasedLearningPath.name}</SheetTitle>
            <SheetDescription>
              Configurez les utilisateurs et les groupes, puis validez en une seule action.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-6 px-5 py-5">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Stagiaires
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-(--color-primary)/20 text-(--color-primary)"
                    >
                      {(purchasedLearningPath.enrollments.length ?? 0) + pendingAddIds.size}
                    </Badge>
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setShowAddUsers(true)}
                    disabled={availableToAdd.length === 0}
                  >
                    <UserPlus className="size-3.5" />
                    Ajouter des stagiaires
                  </Button>
                </div>

                {purchasedLearningPath.enrollments.length > 0 || pendingAddIds.size > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {purchasedLearningPath.enrollments.map((enrollment) => (
                      <UserCard
                        key={enrollment.userId}
                        id={enrollment.userId}
                        fullName={enrollment.fullName}
                      />
                    ))}
                    {[...pendingAddIds].map((userId) => {
                      const user = users.find((u) => u.id === userId);
                      if (!user) return null;
                      return (
                        <UserCard
                          key={userId}
                          id={userId}
                          fullName={user.fullName}
                          pending
                          onRemove={() =>
                            setPendingAddIds((prev) => {
                              const next = new Set(prev);
                              next.delete(userId);
                              return next;
                            })
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground">
                    Aucun utilisateur assigné pour l'instant.
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Groupes
                    {selectedGroupIds.size > 0 && (
                      <Badge className="ml-2 border-(--color-primary)/20 bg-primary/10 text-(--color-primary)">
                        {selectedGroupIds.size} sélectionné(s)
                      </Badge>
                    )}
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setShowCreateGroup(true)}
                  >
                    <Plus className="size-3.5" />
                    Créer un groupe
                  </Button>
                </div>

                {groups.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground">
                    Aucun groupe disponible. Créez-en un via le bouton ci-dessus.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {groups.map((group) => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        users={users}
                        selected={selectedGroupIds.has(group.id)}
                        onClick={() => toggleGroupSelection(group.id)}
                        onEdit={() => setEditingGroup(group)}
                        onDelete={() => {
                          onDeleteGroup(group.id);
                          setSelectedGroupIds((prev) => {
                            const next = new Set(prev);
                            next.delete(group.id);
                            return next;
                          });
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>

          <SheetFooter className="border-t px-5 py-4">
            <div className="flex justify-end gap-3">
              <Button size="lg" variant={'outline'}>
                Annuler
              </Button>
              <Button
                className="gap-2 bg-(--color-primary) text-white hover:bg-(--color-primary)/80"
                size="lg"
                onClick={handleAssign}
              >
                <Save className="size-4" />
                Enregistrer
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
