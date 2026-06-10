"use client";
import * as React from "react";
import {
    AudioWaveform,
    Command,
    GalleryVerticalEnd,
    AudioWaveform as AudioWaveformIcon,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { AdminNavItem } from "@/modules/admin/config/navigation";
import { useAuthStore } from "@/shared/stores/auth.store";

const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    teams: [
        {
            name: "Acme Inc",
            logo: GalleryVerticalEnd,
            plan: "Enterprise",
        },
        {
            name: "Acme Corp.",
            logo: AudioWaveform,
            plan: "Startup",
        },
        {
            name: "Evil Corp.",
            logo: Command,
            plan: "Free",
        },
    ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    navItems?: AdminNavItem[];
    onLogout?: () => void;
}

export function AppSidebar({ navItems, onLogout, ...props }: AppSidebarProps) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems ?? []} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser onLogout={onLogout} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
