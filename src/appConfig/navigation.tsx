import { AccessRule } from "@/shared/auth/permissions";
import { getResourceAccess } from "./resourceAccess";

export interface NavItem {
  to: string;
  label: string;
  resource?: string;
  access?: AccessRule;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Tableau de bord" },
  {
    to: "/users",
    label: "Utilisateurs",
    resource: "users",
    access: getResourceAccess("users"),
  },
  {
    to: "/courses",
    label: "Formations",
    resource: "courses",
    access: getResourceAccess("courses"),
  },
  {
    to: "/trainees",
    label: "Stagiaires",
    resource: "trainees",
    access: getResourceAccess("trainees"),
  },
  {
    to: "/reports",
    label: "Rapports",
    resource: "reports",
    access: getResourceAccess("reports"),
  },
  {
    to: "/tenants",
    label: "Tenants",
    resource: "tenants",
    access: getResourceAccess("tenants"),
  },
];
