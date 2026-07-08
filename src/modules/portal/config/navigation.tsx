import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, LayoutTemplate, Wallet, Store } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';

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
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    items: [],
  },
  {
    url: ROUTES.portal.store,
    title: 'Boutique',
    icon: Store,
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
    icon: Wallet,
    items: [],
  },
  {
    url: ROUTES.portal.certificate,
    title: 'Templates',
    icon: LayoutTemplate,
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
    url: ROUTES.portal.users,
    title: 'Utilisateurs',
    icon: Users,
    items: [],
  },
  // {
  //     url: ROUTES.portal.profile,
  //     title: "Profil",
  //     icon: User,
  //     items: [],
  // },
];
