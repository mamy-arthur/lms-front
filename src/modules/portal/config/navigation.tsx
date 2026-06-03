import type { ReactNode } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SchoolIcon from "@mui/icons-material/School";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import PersonIcon from "@mui/icons-material/Person";
import { ROUTES } from "@/shared/constants/routes";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export const PORTAL_NAV: PortalNavItem[] = [
  {
    href: ROUTES.portal.dashboard,
    label: "Tableau de bord",
    icon: <DashboardIcon />,
  },
  {
    href: ROUTES.portal.courses,
    label: "Mes formations",
    icon: <SchoolIcon />,
  },
  {
    href: ROUTES.portal.certificates,
    label: "Certificats",
    icon: <WorkspacePremiumIcon />,
  },
  {
    href: ROUTES.portal.profile,
    label: "Profil",
    icon: <PersonIcon />,
  },
];
