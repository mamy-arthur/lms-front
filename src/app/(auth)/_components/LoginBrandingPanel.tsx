"use client";

import { useTenant } from "@/shared/hooks/useTenant";

export function LoginBrandingPanel() {
  const { logoUrl, tenantName } = useTenant();

  return (
    <div className="hidden md:flex flex-col items-center justify-center w-[44%] bg-[var(--color-primary)] px-10 py-14 gap-6">
      <div
        className="rounded-2xl w-32 h-28 flex items-center justify-center shadow-xl"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-primary) 60%, black)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={tenantName}
          className="w-20 h-16 object-contain"
        />
      </div>
      <span className="text-white text-4xl font-bold tracking-widest">
        {tenantName}
      </span>
      <span className="text-white/50 text-sm text-center leading-relaxed">
        Votre plateforme e-learning multi-tenant
      </span>
    </div>
  );
}
