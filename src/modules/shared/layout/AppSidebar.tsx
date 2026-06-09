// backgroundColor: "var(--color-primary)",
"use client";
import * as React from "react";
// import Link from "next/link";
// import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "../components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/shared/stores/auth.store";

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
    user: { name: string; avatar?: string } | null;
    logoUrl: string;
    tenantName: string;
    onLogout: () => void;
    children: React.ReactNode;
}

export function LayoutSideBar({
    navItems,
    user,
    logoUrl,
    tenantName,
    onLogout,
    children,
}: AppSidebarProps) {
    // const pathname = usePathname();
    const {user: useUserStore} = useAuthStore()
    console.log(user)

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
            <AppSidebar navItems={navItems}/>
            <SidebarInset>
                {" "}
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
