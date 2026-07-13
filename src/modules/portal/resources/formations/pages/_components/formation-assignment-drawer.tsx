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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { convertMonthsToDays } from '../../data/formations.mock';
import type { FormationGroup, PurchasedFormationRow, TenantAssignableUser } from '../../types';
import { AddUsersDialog } from './add-users-dialog';
import { CreateGroupDialog } from './create-group-dialog';
import { UserCard, GroupCard } from './formation-cards';

// ── FormationAssignmentDrawer ─────────────────────────────────────────────────

interface FormationAssignmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formation: PurchasedFormationRow | null;
  users: TenantAssignableUser[];
  groups: FormationGroup[];
  onUpdateDuration: (formationId: string, durationMonths: number) => void;
  onRemoveUser: (formationId: string, userId: string) => void;
  onAssignUsers: (formationId: string, userIds: string[], durationMonths: number) => number;
  onAssignGroup: (formationId: string, groupId: string, durationMonths: number) => number;
  onCreateGroup: (tenantId: string, name: string, userIds: string[]) => FormationGroup;
}

export function FormationAssignmentDrawer({
  open,
  onOpenChange,
  formation,
  users,
  groups,
  onUpdateDuration,
  onRemoveUser,
  onAssignUsers,
  onAssignGroup,
  onCreateGroup,
}: FormationAssignmentDrawerProps) {
  const [durationMonths, setDurationMonths] = useState(1);
  const durationDays = useMemo(() => convertMonthsToDays(durationMonths), [durationMonths]);

  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(new Set());
  const [pendingAddIds, setPendingAddIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  const [showAddUsers, setShowAddUsers] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    if (!formation || !open) return;
    setDurationMonths(formation.durationMonths);
    setPendingRemoveIds(new Set());
    setPendingAddIds(new Set());
    setSelectedGroupIds(new Set());
    setShowAddUsers(false);
    setShowCreateGroup(false);
  }, [formation, open]);

  const enrolledUserIds = useMemo(
    () => new Set(formation?.enrollments.map((e) => e.userId) ?? []),
    [formation],
  );

  const visibleEnrollments = useMemo(
    () => formation?.enrollments.filter((e) => !pendingRemoveIds.has(e.userId)) ?? [],
    [formation, pendingRemoveIds],
  );

  const availableToAdd = useMemo(
    () => users.filter((u) => !enrolledUserIds.has(u.id) && !pendingAddIds.has(u.id)),
    [users, enrolledUserIds, pendingAddIds],
  );

  if (!formation) return null;

  const handleAddUsersConfirm = (userIds: string[]) => {
    setPendingAddIds((prev) => new Set([...prev, ...userIds]));
  };

  const handleCreateGroupConfirm = (name: string, userIds: string[]) => {
    const group = onCreateGroup(formation.tenantId, name, userIds);
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
    if (durationMonths < 1) {
      toast.error('La durée doit être supérieure ou égale à 1 mois.');
      return;
    }

    onUpdateDuration(formation.id, durationMonths);

    for (const userId of pendingRemoveIds) {
      onRemoveUser(formation.id, userId);
    }

    if (pendingAddIds.size > 0) {
      onAssignUsers(formation.id, [...pendingAddIds], durationMonths);
    }

    let groupCount = 0;
    for (const groupId of selectedGroupIds) {
      groupCount += onAssignGroup(formation.id, groupId, durationMonths);
    }

    const parts: string[] = [];
    if (pendingAddIds.size > 0) parts.push(`${pendingAddIds.size} utilisateur(s) ajouté(s)`);
    if (pendingRemoveIds.size > 0) parts.push(`${pendingRemoveIds.size} retiré(s)`);
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

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="flex w-full flex-col gap-0 p-0 max-w-225! overflow-auto"
          showCloseButton={true}
        >
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>Assigner — {formation.name}</SheetTitle>
            <SheetDescription>
              Configurez la durée, les utilisateurs et les groupes, puis validez en une seule
              action.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-6 px-5 py-5">
              {/* ── Durée ─────────────────────────────────────────────────── */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Durée de la formation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="drawer-duration-months">Durée en mois</Label>
                    <Input
                      id="drawer-duration-months"
                      type="number"
                      min={1}
                      max={24}
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Durée théorique en jours</Label>
                    <Input type="number" value={durationDays} disabled />
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── Utilisateurs ──────────────────────────────────────────── */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Stagiaires
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-(--color-primary)/20 text-(--color-primary)"
                    >
                      {visibleEnrollments.length + pendingAddIds.size}
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

                {visibleEnrollments.length > 0 || pendingAddIds.size > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {visibleEnrollments.map((enrollment) => (
                      <UserCard
                        key={enrollment.userId}
                        id={enrollment.userId}
                        fullName={enrollment.fullName}
                        onRemove={() =>
                          setPendingRemoveIds((prev) => new Set([...prev, enrollment.userId]))
                        }
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

              <Separator />

              {/* ── Groupes ───────────────────────────────────────────────── */}
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
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>

          <SheetFooter className="border-t px-5 py-4">
            <div className="flex justify-end">
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
