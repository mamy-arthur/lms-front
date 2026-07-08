import {
  LayoutDashboard,
  Users,
  GraduationCap,
  User,
  BarChart2,
  Building2,
  LucideIcon,
  Store,
  LayoutTemplate,
  Layers,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { ACCESS } from '@/shared/auth/permissions';
import type { AccessRule } from '@/shared/auth/permissions';

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
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    items: [],
  },
  {
    url: ROUTES.admin.store,
    title: 'Boutique',
    access: ACCESS.store,
    icon: Store,
    items: [],
  },
  {
    url: ROUTES.admin.users,
    title: 'Utilisateurs',
    icon: Users,
    access: ACCESS.users,
    items: [],
  },
  {
    url: ROUTES.admin.courses,
    title: 'Formations',
    icon: GraduationCap,
    access: ACCESS.courses,
    items: [
      { title: 'Parcours', url: ROUTES.admin.programs },
      { title: 'Cours', url: ROUTES.admin.courses },
      { title: 'Catégories', url: ROUTES.admin.category },
      { title: 'Modules', url: ROUTES.admin.modules },
      { title: 'Quiz', url: ROUTES.admin.quizzes },
      // { title: "Attestation", url: ROUTES.admin.certificate},
    ],
  },
  {
    url: ROUTES.admin.certificate,
    title: 'Templates',
    icon: LayoutTemplate,
    access: ACCESS.templates,
    items: [
      { title: 'Attestations', url: ROUTES.admin.certificate },
      { title: 'Templates mail', url: ROUTES.admin.mailTemplates },
    ],
  },
  {
    url: ROUTES.admin.trainees,
    title: 'Stagiaires',
    icon: User,
    access: ACCESS.trainees,
    items: [],
  },
  {
    url: ROUTES.admin.reports,
    title: 'Rapports',
    icon: BarChart2,
    access: ACCESS.reports,
    items: [],
  },
  {
    url: ROUTES.admin.tenants,
    title: 'Tenants',
    icon: Building2,
    access: ACCESS.tenants,
    items: [{ title: 'Tenants', url: ROUTES.admin.tenants }],
  },
  {
    url: ROUTES.admin.contentTypes,
    title: 'Content Types',
    icon: Layers,
    access: ACCESS.contentTypes,
    items: [],
  },
];
