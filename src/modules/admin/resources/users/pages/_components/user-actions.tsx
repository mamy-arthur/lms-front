"use client";

import { UserActions as SharedUserActions } from "@/shared/components/users";

interface UserActionsProps {
  isActive: boolean;
  userLabel: string;
  onView?: () => void;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
}

export function UserActions(props: UserActionsProps) {
  return <SharedUserActions {...props} />;
}
