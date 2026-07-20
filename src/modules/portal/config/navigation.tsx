import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  LayoutTemplate,
  Wallet,
  Store,
  GraduationCap,
  ClipboardList,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { ACCESS } from '@/shared/auth/permissions';
import { AccessRule } from '@/shared/auth/permissions';

export interface PortalNavItem {
  url: string;
  title: string;
  icon: LucideIcon;
  isActive?: boolean;
  access?: AccessRule;
  items: { title: string; url: string }[];
}

export const PORTAL_NAV: PortalNavItem[] = [
  {
    url: ROUTES.portal.dashboard,
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    access: ACCESS.dashboard,
    items: [],
  },
  {
    url: ROUTES.portal.store,
    title: 'Boutique',
    icon: Store,
    access: ACCESS.store,
    items: [],
  },
  // {
  //   url: '#',
  //   title: 'Mes formations',
  //   icon: GraduationCap,
  //   items: [
  //     // { title: "Cours", url: ROUTES.portal.courses },
  //     // { title: "Catégories", url: ROUTES.portal.category },
  //     // { title: "Modules", url: ROUTES.portal.modules },
  //     // { title: "Quizzes", url: ROUTES.portal.quizzes },
  //     // { title: "Attestation", url: ROUTES.portal.certificate}
  //   ],
  // },
  {
    url: ROUTES.portal.wallet,
    title: 'Portefeuille',
    access: ACCESS.wallet,
    icon: Wallet,
    items: [],
  },
  {
    url: ROUTES.portal.formations,
    title: 'Formations',
    icon: GraduationCap,
    access: ACCESS.formationsManagement,
    items: [],
  },
  {
    url: ROUTES.portal.certificate,
    title: 'Templates',
    icon: LayoutTemplate,
    access: ACCESS.templates,
    items: [
      { title: 'Attestations', url: ROUTES.portal.certificate },
      { title: 'Templates mail', url: ROUTES.portal.mailTemplates },
    ],
  },
  // {
  //     url: ROUTES.portal.certificates,
  //     title: "Certificats",
  //     icon: Award,
  //     items: [],
  // },
  {
    url: ROUTES.portal.evaluationNotes,
    title: 'Notes des stagiaires',
    access: ACCESS.notes,
    icon: ClipboardList,
    items: [],
  },
  {
    url: ROUTES.portal.users,
    title: 'Utilisateurs',
    icon: Users,
    access: ACCESS.users,
    items: [],
  },
  {
    url: ROUTES.portal.traineeDashboard,
    icon: LayoutDashboard,
    title: 'Dashboard',
    access: ACCESS.dashboardTrainee,
    items: [],
  },
  {
    url: ROUTES.portal.traineeFormations,
    icon: GraduationCap,
    title: 'Mes formations',
    access: ACCESS.formationTrainee,
    items: [],
  },

  // {
  //     url: ROUTES.portal.profile,
  //     title: "Profil",
  //     icon: User,
  //     items: [],
  // },
];
