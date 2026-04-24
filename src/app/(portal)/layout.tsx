"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/modules/auth/guards/AuthGuard";
import { useTenant } from "@/shared/hooks/useTenant";
import { cn } from "@/shared/lib/cn";
import { ROUTES } from "@/shared/constants/routes";

const NAV = [
  { href: ROUTES.portal.dashboard, label: "Tableau de bord" },
  { href: ROUTES.portal.courses,   label: "Mes formations" },
  { href: ROUTES.portal.certificates, label: "Certificats" },
  { href: ROUTES.portal.profile,   label: "Profil" },
];

function PortalSidebar() {
  const { tenantName, logoUrl } = useTenant();
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={tenantName} className="h-8 w-8 rounded object-contain" />
        <span className="font-bold text-sm truncate">{tenantName || "Learneo"}</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === href
                ? "bg-[var(--color-primary,#2563eb)] text-white"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <PortalSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
