'use client';
import * as React from 'react';
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react';
import { NavMain } from './nav-main';
import { TeamSwitcher } from './team-switcher';
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { AdminNavItem } from '@/modules/admin/config/navigation';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navItems?: AdminNavItem[];
}

export function AppSidebar({ navItems, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems ?? []} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
