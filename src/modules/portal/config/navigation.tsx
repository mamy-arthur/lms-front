import type { LucideIcon } from "lucide-react";
import {
    LayoutDashboard,
    GraduationCap,
    Award,
    Users,
    User,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

export interface PortalNavItem {
    url: string;
    title: string;
    icon: LucideIcon;
    isActive?: boolean;
    items: { title: string; url: string }[];
}

export const PORTAL_NAV: PortalNavItem[] = [
    {
        url: ROUTES.portal.dashboard,
        title: "Tableau de bord",
        icon: LayoutDashboard,
        items:[]
    },
    {
        url: ROUTES.portal.courses,
        title: "Mes formations",
        icon: GraduationCap,
        items:[
            { title: "Modules", url: ROUTES.portal.modules },
            { title: "Quizzes", url: ROUTES.portal.quizzes },
        ]
    },
    {
        url: ROUTES.portal.certificates,
        title: "Certificats",
        icon: Award,
        items:[]
    },
    {
        url: ROUTES.portal.users,
        title: "Utilisateurs",
        icon: Users,
        items:[{ title: "utilisateurs", url: ROUTES.portal.users }]
    },
    {
        url: ROUTES.portal.profile,
        title: "Profil",
        icon: User,
        items:[]
    },
];
