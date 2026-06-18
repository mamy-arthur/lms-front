import type { ReactNode } from "react";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    User,
    BarChart2,
    Building2,
    LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { ACCESS } from "@/shared/auth/permissions";
import type { AccessRule } from "@/shared/auth/permissions";

export interface AdminNavItem {
    url: string;
    title: string;
    icon: LucideIcon;
    access?: AccessRule;
    items: { title: string; url: string }[];
}

export const ADMIN_NAV: AdminNavItem[] = [
    {
        url: ROUTES.admin.root,
        title: "Tableau de bord",
        icon: LayoutDashboard,
        items: [{ title: "Tableau de bord", url: ROUTES.admin.root }],
    },
    {
        url: ROUTES.admin.users,
        title: "Utilisateurs",
        icon: Users,
        access: ACCESS.users,
        items: [{ title: "Utilisateurs", url: ROUTES.admin.users }],
    },
    {
        url: ROUTES.admin.courses,
        title: "Formations",
        icon: GraduationCap,
        access: ACCESS.courses,
        items: [
            { title: "Cours", url: ROUTES.admin.courses }, 
            { title: "Catégories", url: ROUTES.admin.category },
            { title: "Modules", url: ROUTES.admin.modules },
        ],
    },
    {
        url: ROUTES.admin.trainees,
        title: "Stagiaires",
        icon: User,
        access: ACCESS.trainees,
        items: [],
    },
    {
        url: ROUTES.admin.reports,
        title: "Rapports",
        icon: BarChart2,
        access: ACCESS.reports,
        items: [],
    },
    {
        url: ROUTES.admin.tenants,
        title: "Tenants",
        icon: Building2,
        access: ACCESS.tenants,
        items: [{ title: "Tenants", url: ROUTES.admin.tenants }],
    },
];
