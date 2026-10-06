'use client';
import * as React from 'react';
import Image from 'next/image';
import { NavMain } from './nav-main';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { AdminNavItem } from '@/modules/admin/config/navigation';
import { cn } from '@/lib/utils';

interface SidebarBrandingProps {
  logoUrl?: string | null;
  tenantName?: string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar>, SidebarBrandingProps {
  navItems?: AdminNavItem[];
}

const DEFAULT_LOGO = '/logo-default.svg';

function SidebarLogo({ logoUrl, tenantName }: SidebarBrandingProps) {
  const { state, isMobile } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;
  const name = tenantName?.trim() || 'Learneo';
  const requestedLogo = logoUrl?.trim() || DEFAULT_LOGO;
  const [failedLogo, setFailedLogo] = React.useState<string>();
  const src = requestedLogo === failedLogo ? DEFAULT_LOGO : requestedLogo;

  return (
    <div
      className={cn(
        'mt-2 mb-2 flex  min-w-0 items-center gap-2.5',
        collapsed ? 'justify-center' : 'px-2',
      )}
      title={name}
    >
      <Image
        src={src}
        alt={`Logo de ${name}`}
        width={32}
        height={32}
        unoptimized
        className="size-8 shrink-0 object-contain"
        onError={src !== DEFAULT_LOGO ? () => setFailedLogo(requestedLogo) : undefined}
      />
      {!collapsed && (
        <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
          {name}
        </span>
      )}
    </div>
  );
}

export function AppSidebar({ navItems, logoUrl, tenantName, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo logoUrl={logoUrl} tenantName={tenantName} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems ?? []} />
      </SidebarContent>
      <SidebarFooter>{/* <DevBanner /> */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
