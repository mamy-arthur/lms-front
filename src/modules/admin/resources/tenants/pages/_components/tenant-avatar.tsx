import { getInitials } from '@/shared/lib/string/getInitials';
import { Tenant } from '@/shared/types/tenants/tenant';

const BASE_DOMAIN = (process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'localhost').split(':')[0];

interface TenantAvatarProps {
  tenant: Pick<Tenant, 'name' | 'subdomain' | 'initials' | 'domains'>;
}

export function TenantAvatar({ tenant }: TenantAvatarProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-9 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 bg-gray-300"
        aria-hidden="true"
      >
        {getInitials(tenant.name)}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{tenant.name}</p>
        <p className="text-xs font-mono truncate text-blue-600 underline">
          {tenant.domains[0].subdomain}.{BASE_DOMAIN}
        </p>
      </div>
    </div>
  );
}
