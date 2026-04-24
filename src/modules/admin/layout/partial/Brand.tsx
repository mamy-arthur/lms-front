"use client";
import { useTenant } from "@/shared/hooks/useTenant";
import Image from "next/image";

export function Brand() {
  const { logoUrl, tenantName } = useTenant();

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <Image
        src={logoUrl}
        alt={tenantName}
        width={32}
        height={32}
        className="rounded"
      />
      <span className="font-semibold text-sm truncate">{tenantName}</span>
    </div>
  );
}
