"use client";

import { Loader2, Plus, Save, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getApiErrorMessage } from "@/shared/lib/errors";
import type {
  CreateEnrollmentPayload,
  CreateEnrollmentResponse,
} from "@/shared/types/enrollment.types";
import { usePurchasedLearningPathEnrollmentsQuery } from "../../hooks/usePurchasedLearningPathEnrollmentsQuery";
import type {
  AssignableGroup,
  PurchasedLearningPathRow,
  TenantAssignableUser,
} from "../../types";
import { AddUsersDialog } from "./add-users-dialog";
import { GroupCard, UserCard } from "./cards";
import { CreateGroupDialog } from "./create-group-dialog";

interface PurchasedLearningPathEnrollmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchasedLearningPath: PurchasedLearningPathRow | null;
  users: TenantAssignableUser[];
  groups: AssignableGroup[];
  onCreateGroup: (
    name: string,
    traineeIds: string[],
  ) => Promise<AssignableGroup>;
  onEditGroup: (
    group: AssignableGroup,
    name: string,
    traineeIds: string[],
  ) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onAssign: (
    payload: CreateEnrollmentPayload,
  ) => Promise<CreateEnrollmentResponse>;
  isCreatingGroup?: boolean;
  isUpdatingGroup?: boolean;
  isDeletingGroup?: boolean;
  isAssigning?: boolean;
}

export function PurchasedLearningPathEnrollmentDrawer({
  open,
  onOpenChange,
  purchasedLearningPath,
  users = [],
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
  const [pendingAddIds, setPendingAddIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    new Set(),
  );
  const [editingGroup, setEditingGroup] = useState<AssignableGroup | null>(
    null,
  );

  const [showAddUsers, setShowAddUsers] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const isBusy =
    isCreatingGroup || isUpdatingGroup || isDeletingGroup || isAssigning;

  const { enrollments: enrolledUsers } =
    usePurchasedLearningPathEnrollmentsQuery(
      open ? purchasedLearningPath?.id : null,
    );

  useEffect(() => {
    if (!purchasedLearningPath || !open) return;
    setPendingAddIds(new Set());
    setSelectedGroupIds(new Set());
    setEditingGroup(null);
    setShowAddUsers(false);
    setShowCreateGroup(false);
  }, [purchasedLearningPath, open]);

  const enrolledUserIds = useMemo(
    () => new Set(enrolledUsers.map((e) => e.userId)),
    [enrolledUsers],
  );

  const availableToAdd = useMemo(
    () =>
      users.filter(
        (u) => !enrolledUserIds.has(u.id) && !pendingAddIds.has(u.id),
      ),
    [users, enrolledUserIds, pendingAddIds],
  );

  if (!purchasedLearningPath) return null;

  const handleAddUsersConfirm = (userIds: string[]) => {
    setPendingAddIds((prev) => new Set([...prev, ...userIds]));
  };

  const handleCreateGroupConfirm = async (name: string, userIds: string[]) => {
    try {
      const group = await onCreateGroup(name, userIds);
      setSelectedGroupIds((prev) => new Set([...prev, group.id]));
      setShowCreateGroup(false);
      toast.success(`Groupe "${group.name}" créé.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de créer le groupe."));
    }
  };

  const handleEditGroupConfirm = async (name: string, userIds: string[]) => {
    if (!editingGroup) return;
    try {
      await onEditGroup(editingGroup, name, userIds);
      setEditingGroup(null);
      toast.success(`Groupe "${name}" mis à jour.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de modifier le groupe."));
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
      toast.success("Groupe supprimé.");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer le groupe."),
      );
    }
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

  const handleAssign = async () => {
    const learningPathId = purchasedLearningPath.learningPathId;
    const traineeIds = [...pendingAddIds];
    const groupIds = [...selectedGroupIds];

    if (traineeIds.length === 0 && groupIds.length === 0) {
      toast.info("Aucune modification à enregistrer.");
      return;
    }

    const payload: CreateEnrollmentPayload = {
      learning_path_id: learningPathId,
      ...(traineeIds.length > 0 ? { learner_ids: traineeIds } : {}),
      ...(groupIds.length > 0 ? { group_ids: groupIds } : {}),
    };

    try {
      const response = await onAssign(payload);

      if (response.meta.enrolled_count > 0) {
        toast.success(response.message);
      } else {
        toast.info(response.message);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer les inscriptions."),
      );
    }
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
        isSubmitting={isCreatingGroup}
      />
      <CreateGroupDialog
        open={Boolean(editingGroup)}
        onOpenChange={(dialogOpen) => {
          if (!dialogOpen) setEditingGroup(null);
        }}
        allUsers={users}
        initialName={editingGroup?.name}
        initialUserIds={editingGroup?.userIds}
        onConfirm={handleEditGroupConfirm}
        isSubmitting={isUpdatingGroup}
      />

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="flex w-full flex-col gap-0 p-0 max-w-225! overflow-auto"
          showCloseButton={true}
        >
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>Inscrire — {purchasedLearningPath.name}</SheetTitle>
            <SheetDescription>
              Sélectionnez les stagiaires à inscrire et les groupes, puis
              validez en une seule action.
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
                      {enrolledUsers.length + pendingAddIds.size}
                    </Badge>
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setShowAddUsers(true)}
                    disabled={availableToAdd.length === 0 || isBusy}
                  >
                    <UserPlus className="size-3.5" />
                    Ajouter des stagiaires
                  </Button>
                </div>

                {enrolledUsers.length > 0 || pendingAddIds.size > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {enrolledUsers.map((enrollment) => (
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
                    Aucun stagiaire inscrit pour l'instant.
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
                    disabled={isBusy}
                  >
                    <Plus className="size-3.5" />
                    Créer un groupe
                  </Button>
                </div>

                {groups.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground">
                    Aucun groupe disponible. Créez-en un via le bouton
                    ci-dessus.
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
                          void handleDeleteGroup(group.id);
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
              <Button
                size="lg"
                variant="outline"
                disabled={isBusy}
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                className="gap-2 bg-(--color-primary) text-white hover:bg-(--color-primary)/80"
                size="lg"
                onClick={() => void handleAssign()}
                disabled={isBusy}
              >
                {isAssigning ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Enregistrer
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
