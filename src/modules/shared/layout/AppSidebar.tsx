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
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "../components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarNavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

interface AppSidebarProps {
    navItems: SidebarNavItem[];
    user: { name: string; avatar?: string } | null;
    logoUrl: string;
    tenantName: string;
    onLogout: () => void;
    children: React.ReactNode;
}

// ─── Drawer MUI (identique admin + portal) ────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

// function getInitials(name: string): string {
//     return name
//         .split(" ")
//         .map((n) => n[0])
//         .join("")
//         .toUpperCase()
//         .slice(0, 2);
// }

// ─── Composant ────────────────────────────────────────────────────────────────

export function LayoutSideBar({
    navItems,
    user,
    logoUrl,
    tenantName,
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
            <AppSidebar />
            <SidebarInset>
                {" "}
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">
                                        Build Your Application
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        Data Fetching
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
