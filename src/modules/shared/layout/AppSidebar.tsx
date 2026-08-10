// backgroundColor: "var(--color-primary)",
'use client';
import * as React from 'react';
// import Link from "next/link";
// import Image from "next/image";
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/sidebar/app-sidebar';
import { LucideIcon } from 'lucide-react';
import { AppHeader } from '../components/sidebar/app-header';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarNavItem {
  url: string;
  title: string;
  icon: LucideIcon;
  isActive?: boolean;
  items: { title: string; url: string }[];
}

interface AppSidebarProps {
  navItems: SidebarNavItem[];
  user: { name: string; avatar?: string | null } | null;
  logoUrl: string;
  tenantName: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export function LayoutSideBar({
  navItems,
  // user,
  // logoUrl,
  // tenantName,
  onLogout,
  children,
}: AppSidebarProps) {
  // const pathname = usePathname();
  // const isActive = (href: string) =>
  //     pathname !== null &&
  //     (href === pathname || pathname.startsWith(href + "/"));

  // const navItemSx = (active: boolean) => [
  //     {
  //         minHeight: 44,
  //         px: 2,
  //         mx: 0.5,
  //         borderRadius: 2,
  //         color: "rgba(255,255,255,0.85)",
  //         "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
  //         ...(active && {
  //             bgcolor: "rgba(255,255,255,0.18)",
  //             color: "white",
  //             fontWeight: 700,
  //         }),
  //     },
  //     open ? { justifyContent: "initial" } : { justifyContent: "center" },
  // ];

  return (
    <SidebarProvider>
      <AppSidebar navItems={navItems} />
      <SidebarInset>
        <AppHeader onLogout={onLogout} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-5">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
