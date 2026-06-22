import { getInitials } from "@/shared/lib/string/getInitials";
import { Tenant } from "@/shared/types/tenants/tenant";

interface TenantAvatarProps {
    tenant: Pick<Tenant, "name" | "subdomain" | "initials" | "domains">;
}

export function TenantAvatar({ tenant }: TenantAvatarProps) {
    return (
        <div className="flex items-center gap-3">
            <div
                className="size-9 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 bg-yellow-200"
                aria-hidden="true"
            >
                {getInitials(tenant.name)}
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                    {tenant.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                    {tenant.domains[0].subdomain}.app.io
                </p>
            </div>
        </div>
    );
}
