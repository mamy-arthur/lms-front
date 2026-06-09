import { Badge } from "@/components/ui/badge";
import { TenantStatus } from "@/shared/types/tenants/tenant";
import { cn } from "@/lib/utils";

interface TenantStatusBadgeProps {
  status: TenantStatus;
}

const STATUS_CONFIG: Record<
  TenantStatus,
  { label: string; className: string; dotColor: string }
> = {
  active: {
    label: "Actif",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
    dotColor: "bg-emerald-500",
  },
  suspended: {
    label: "Suspendu",
    className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
    dotColor: "bg-red-500",
  },
  trial: {
    label: "Essai",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50",
    dotColor: "bg-indigo-500",
  },
};

export function TenantStatusBadge({ status }: TenantStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border",
        config.className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", config.dotColor)} />
      {config.label}
    </Badge>
  );
}