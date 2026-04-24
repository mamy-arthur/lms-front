"use client";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { AccessRule } from "@/shared/auth/permissions";

interface RoleGuardProps {
  rule: AccessRule;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ rule, children, fallback = null }: RoleGuardProps) {
  const { can } = usePermissions();
  if (!can(rule)) return <>{fallback}</>;
  return <>{children}</>;
}
