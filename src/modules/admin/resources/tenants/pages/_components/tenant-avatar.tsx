import { Tenant } from "@/shared/types/tenants/tenant";


interface TenantAvatarProps {
  tenant: Pick<Tenant, "name" | "subdomain" | "initials" | "avatarColor" | "avatarTextColor">;
}

export function TenantAvatar({ tenant }: TenantAvatarProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-9 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
        style={{
          backgroundColor: tenant.avatarColor,
          color: tenant.avatarTextColor,
        }}
        aria-hidden="true"
      >
        {tenant.initials}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{tenant.name}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {tenant.subdomain}.app.io
        </p>
      </div>
    </div>
  );
}