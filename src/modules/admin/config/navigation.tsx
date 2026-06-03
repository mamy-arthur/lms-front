import type { ReactNode } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BusinessIcon from "@mui/icons-material/Business";
import { ROUTES } from "@/shared/constants/routes";
import { ACCESS } from "@/shared/auth/permissions";
import type { AccessRule } from "@/shared/auth/permissions";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  access?: AccessRule;
}

export const ADMIN_NAV: AdminNavItem[] = [
  {
    href: ROUTES.admin.root,
    label: "Tableau de bord",
    icon: <DashboardIcon />,
  },
  {
    href: ROUTES.admin.users,
    label: "Utilisateurs",
    icon: <PeopleIcon />,
    access: ACCESS.users,
  },
  {
    href: ROUTES.admin.courses,
    label: "Formations",
    icon: <SchoolIcon />,
    access: ACCESS.courses,
  },
  {
    href: ROUTES.admin.trainees,
    label: "Stagiaires",
    icon: <PersonIcon />,
    access: ACCESS.trainees,
  },
  {
    href: ROUTES.admin.reports,
    label: "Rapports",
    icon: <AssessmentIcon />,
    access: ACCESS.reports,
  },
  {
    href: ROUTES.admin.tenants,
    label: "Tenants",
    icon: <BusinessIcon />,
    access: ACCESS.tenants,
  },
];
