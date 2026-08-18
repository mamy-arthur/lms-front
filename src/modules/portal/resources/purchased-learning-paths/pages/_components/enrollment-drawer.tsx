'use client';

import { Check, GraduationCap, Loader2, Plus, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/shared/lib/errors';
import type {
  CreateEnrollmentPayload,
  CreateEnrollmentResponse,
} from '@/shared/types/enrollment.types';
import { usePurchasedLearningPathLearnersQuery } from '../../hooks/usePurchasedLearningPathLearnersQuery';
import type {
  AssignableGroup,
  EnrolledLearner,
  PurchasedLearningPathRow,
} from '../../types';
import { AddUsersDialog } from './add-users-dialog';
import { GroupCard, StagiaireChip } from './cards';
import { CreateGroupDialog } from './create-group-dialog';

interface PurchasedLearningPathEnrollmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchasedLearningPath: PurchasedLearningPathRow | null;
  groups: AssignableGroup[];
  onCreateGroup: (name: string, traineeIds: string[]) => Promise<AssignableGroup>;
  onEditGroup: (group: AssignableGroup, name: string, traineeIds: string[]) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onAssign: (payload: CreateEnrollmentPayload) => Promise<CreateEnrollmentResponse>;
  isCreatingGroup?: boolean;
  isUpdatingGroup?: boolean;
  isDeletingGroup?: boolean;
  isAssigning?: boolean;
}

export function PurchasedLearningPathEnrollmentDrawer({
  open,
  onOpenChange,
  purchasedLearningPath,
  groups = [],
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onAssign,
  isCreatingGroup = false,
  isUpdatingGroup = false,
  isDeletingGroup = false,
  isAssigning = false,
}: PurchasedLearningPathEnrollmentDrawerProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [groupReEnrollMemberIds, setGroupReEnrollMemberIds] = useState<Map<string, Set<string>>>(
    new Map(),
  );
  const [editingGroup, setEditingGroup] = useState<AssignableGroup | null>(null);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const isBusy = isCreatingGroup || isUpdatingGroup || isDeletingGroup || isAssigning;

  const plpId = purchasedLearningPath?.id;

  const { learners } = usePurchasedLearningPathLearnersQuery(open ? plpId : null);

  const enrolledLearners = useMemo(
    () => learners.filter((l): l is EnrolledLearner => l.enrollment !== null),
    [learners],
  );

  useEffect(() => {
    if (!plpId || !open) return;
    setSelectedUserIds(new Set());
    setSelectedGroupIds(new Set());
    setGroupReEnrollMemberIds(new Map());
    setEditingGroup(null);
    setShowAddUsers(false);
    setShowCreateGroup(false);
  }, [plpId, open]);

  const enrolledAtMap = useMemo(
    () => new Map(enrolledLearners.map((l) => [l.id, l.enrollment.enrolledAt])),
    [enrolledLearners],
  );

  const selectedGroupUserIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of groups) {
      if (!selectedGroupIds.has(group.id)) continue;
      const reEnrollMembers = groupReEnrollMemberIds.get(group.id) ?? new Set();
      for (const userId of group.userIds) {
        if (!enrolledAtMap.has(userId) || reEnrollMembers.has(userId)) ids.add(userId);
      }
    }
    return ids;
  }, [groups, selectedGroupIds, groupReEnrollMemberIds, enrolledAtMap]);

  const netAssignableUserIds = useMemo(
    () => new Set<string>([...selectedUserIds, ...selectedGroupUserIds]),
    [selectedUserIds, selectedGroupUserIds],
  );

  const netAssignableCount = netAssignableUserIds.size;

  if (!purchasedLearningPath) return null;

  const creditsAvailable = purchasedLearningPath.creditsAvailable;
  const creditsTotal = purchasedLearningPath.creditsTotal;
  const hasInsufficientCredits = netAssignableCount > creditsAvailable;
  const creditsAfter = creditsAvailable - netAssignableCount;

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
        setGroupReEnrollMemberIds((m) => {
          const n = new Map(m);
          n.delete(groupId);
          return n;
        });
      } else {
        next.add(groupId);
        setGroupReEnrollMemberIds((m) => new Map([...m, [groupId, new Set()]]));
      }
      return next;
    });
  };

  const handleToggleReEnrollMember = (groupId: string, userId: string, value: boolean) => {
    setGroupReEnrollMemberIds((prev) => {
      const next = new Map(prev);
      const members = new Set(next.get(groupId) ?? []);
      if (value) members.add(userId);
      else members.delete(userId);
      next.set(groupId, members);
      return next;
    });
  };

  const handleAddUsersConfirm = (userIds: string[]) => {
    setSelectedUserIds(new Set(userIds));
  };

  const handleCreateGroupConfirm = async (name: string, userIds: string[]) => {
    try {
      const group = await onCreateGroup(name, userIds);
      setSelectedGroupIds((prev) => new Set([...prev, group.id]));
      setShowCreateGroup(false);
      toast.success(`Groupe "${group.name}" créé.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible de créer le groupe.'));
    }
  };

  const handleEditGroupConfirm = async (name: string, userIds: string[]) => {
    if (!editingGroup) return;
    try {
      await onEditGroup(editingGroup, name, userIds);
      setEditingGroup(null);
      toast.success(`Groupe "${name}" mis à jour.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible de modifier le groupe.'));
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await onDeleteGroup(groupId);
      setSelectedGroupIds((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      toast.success('Groupe supprimé.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible de supprimer le groupe.'));
    }
  };

  const handleAssign = async () => {
    if (hasInsufficientCredits) return;

    const learnerIds = new Set<string>(selectedUserIds);
    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (!group) continue;
      const reEnrollMembers = groupReEnrollMemberIds.get(groupId) ?? new Set();
      for (const uid of group.userIds) {
        if (!enrolledAtMap.has(uid) || reEnrollMembers.has(uid)) learnerIds.add(uid);
      }
    }
    const traineeIds = [...learnerIds];

    if (traineeIds.length === 0) {
      toast.info('Aucune sélection à enregistrer.');
      return;
    }

    const payload: CreateEnrollmentPayload = {
      learning_path_id: purchasedLearningPath.learningPathId,
      learner_ids: traineeIds,
    };

    try {
      const response = await onAssign(payload);
      if (response.meta.enrolled_count > 0) {
        toast.success(`${response.meta.enrolled_count} stagiaire(s) inscrit(s) avec succès.`);
      } else {
        toast.info('Aucun nouvel inscrit — les stagiaires sélectionnés étaient déjà inscrits.');
      }
      onOpenChange(false);
    } catch {
      toast.error("Impossible d'enregistrer les inscriptions.");
    }
  };

  const ctaLabel =
    netAssignableCount === 0
      ? 'Inscrire les stagiaires'
      : `Inscrire ${netAssignableCount} stagiaire${netAssignableCount !== 1 ? 's' : ''}`;

  return (
    <>
      <AddUsersDialog
        open={showAddUsers}
        onOpenChange={setShowAddUsers}
        allUsers={learners}
        initialSelectedIds={selectedUserIds}
        enrolledAtMap={enrolledAtMap}
        onConfirm={handleAddUsersConfirm}
      />
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        allUsers={learners}
        onConfirm={handleCreateGroupConfirm}
        isSubmitting={isCreatingGroup}
      />
      <CreateGroupDialog
        open={Boolean(editingGroup)}
        onOpenChange={(next) => {
          if (!next) setEditingGroup(null);
        }}
        allUsers={learners}
        initialName={editingGroup?.name}
        initialUserIds={editingGroup?.userIds}
        onConfirm={handleEditGroupConfirm}
        isSubmitting={isUpdatingGroup}
      />

      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!isBusy) onOpenChange(next);
        }}
      >
        <SheetContent
          className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 max-w-225!"
          showCloseButton={true}
        >
          {/* ── Header ── */}
          <SheetHeader className="shrink-0 border-b px-5 py-3">
            <SheetTitle className="text-sm font-bold">Inscrire des stagiaires</SheetTitle>
            <SheetDescription>
              Sélectionnez les stagiaires à inscrire, puis validez.
            </SheetDescription>
          </SheetHeader>
          <div className="shrink-0 px-5 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <p className="flex items-center gap-2 truncate text-xs text-foreground">
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span className="truncate">{purchasedLearningPath.name}</span>
              </p>
              {creditsTotal > 0 && (
                <div className="flex shrink-0 items-center gap-2.5 text-[11px] text-muted-foreground">
                  <span>
                    <span className="font-semibold text-foreground">
                      {Math.max(0, creditsAvailable - netAssignableCount)}
                    </span>{' '}
                    crédits disponibles
                  </span>
                  <span className="inline-block size-1 rounded-full bg-muted-foreground/30" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {Math.min(netAssignableCount, creditsAvailable)}
                    </span>{' '}
                    crédits à utiliser
                  </span>
                </div>
              )}
            </div>
            {hasInsufficientCredits && (
              <p className="mt-1 text-xs font-medium text-destructive">
                Crédits insuffisants pour cette sélection.
              </p>
            )}
          </div>

          {/* ── Content ── */}
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-6 px-5 py-5">
              {/* Stagiaires */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Stagiaires
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-(--color-primary)/20 text-(--color-primary)"
                    >
                      {enrolledLearners.filter((l) => !selectedUserIds.has(l.id)).length +
                        netAssignableUserIds.size}
                    </Badge>
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setShowAddUsers(true)}
                    disabled={learners.length === 0 || isBusy}
                  >
                    <UserPlus className="size-3.5" />
                    Ajouter des stagiaires
                  </Button>
                </div>

                {enrolledLearners.length > 0 || selectedUserIds.size > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {enrolledLearners
                      .filter((l) => !selectedUserIds.has(l.id))
                      .map((learner) => (
                        <StagiaireChip
                          key={learner.id}
                          name={learner.fullName}
                          email={learner.email}
                          avatarUrl={learner.avatarUrl}
                          status="already-enrolled"
                          enrolledAt={learner.enrollment.enrolledAt}
                          onSelect={() =>
                            setSelectedUserIds((prev) => new Set([...prev, learner.id]))
                          }
                        />
                      ))}
                    {[...selectedUserIds].map((userId) => {
                      const learner = learners.find((l) => l.id === userId);
                      const isReEnrollment = enrolledAtMap.has(userId);
                      return (
                        <StagiaireChip
                          key={userId}
                          name={learner?.fullName ?? userId}
                          email={learner?.email}
                          avatarUrl={learner?.avatarUrl ?? null}
                          status="will-enroll"
                          isReEnrollment={isReEnrollment}
                          onRemove={() =>
                            setSelectedUserIds((prev) => {
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
                    Aucun stagiaire inscrit pour l'instant.
                  </p>
                )}
              </section>

              {/* Groupes */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Groupes
                    {selectedGroupIds.size > 0 && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {selectedGroupIds.size} sélectionné{selectedGroupIds.size !== 1 ? 's' : ''}
                      </span>
                    )}
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setShowCreateGroup(true)}
                    disabled={isBusy}
                  >
                    <Plus className="size-3.5" />
                    Créer un groupe
                  </Button>
                </div>

                {groups.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground">
                    Aucun groupe disponible. Créez-en un ci-dessus.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 items-start">
                    {groups.map((group) => {
                      const gEnrolledCount = group.userIds.filter((id) =>
                        enrolledAtMap.has(id),
                      ).length;
                      const gAvailableCount = group.userIds.length - gEnrolledCount;
                      const gMembers = learners.filter((l) => group.userIds.includes(l.id));
                      return (
                        <GroupCard
                          key={group.id}
                          group={group}
                          members={gMembers}
                          enrolledAtMap={enrolledAtMap}
                          availableCount={gAvailableCount}
                          enrolledCount={gEnrolledCount}
                          selected={selectedGroupIds.has(group.id)}
                          reEnrollMemberIds={groupReEnrollMemberIds.get(group.id)}
                          onClick={() => toggleGroup(group.id)}
                          onToggleReEnrollMember={(uid, v) =>
                            handleToggleReEnrollMember(group.id, uid, v)
                          }
                          onEdit={() => setEditingGroup(group)}
                          onDelete={() => void handleDeleteGroup(group.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>

          {/* ── Footer ── */}
          <SheetFooter className="shrink-0 border-t px-5 py-4">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="min-w-0">
                {netAssignableCount > 0 ? (
                  <>
                    <p className="text-xs font-semibold text-foreground">
                      {netAssignableCount === 1
                        ? '1 stagiaire sera inscrit'
                        : `${netAssignableCount} stagiaires seront inscrits au total`}
                    </p>
                    <p
                      className={cn(
                        'text-xs',
                        hasInsufficientCredits ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {netAssignableCount === 1
                        ? '1 crédit consommé'
                        : `${netAssignableCount} crédits consommés`}
                      {hasInsufficientCredits
                        ? ` · ${creditsAvailable === 1 ? '1 disponible' : `${creditsAvailable} disponibles`} (insuffisant)`
                        : ` · ${creditsAfter === 1 ? '1 restant' : `${creditsAfter} restants`} après inscription`}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Aucun stagiaire sélectionné</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Button variant="outline" disabled={isBusy} onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button
                  className="gap-2 bg-primary text-white hover:bg-primary/80"
                  onClick={() => void handleAssign()}
                  disabled={isBusy || hasInsufficientCredits || netAssignableCount === 0}
                >
                  {isAssigning ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {ctaLabel}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
