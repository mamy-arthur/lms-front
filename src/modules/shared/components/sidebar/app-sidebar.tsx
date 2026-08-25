'use client';
import * as React from 'react';
import { NavMain } from './nav-main';
import { DevBanner } from './dev-banner';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { AdminNavItem } from '@/modules/admin/config/navigation';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navItems?: AdminNavItem[];
}

function SidebarLogo() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <div className="flex items-center px-2 py-3 mb-2">
      <img
        src="/logo.png"
        alt="Logo"
        className={collapsed ? 'h-7 w-7 object-contain' : 'h-12.5 w-full object-contain'}
      />
    </div>
  );
}

export function AppSidebar({ navItems, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems ?? []} />
      </SidebarContent>
      <SidebarFooter>
        <DevBanner />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
