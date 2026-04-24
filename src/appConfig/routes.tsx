import { AccessRule } from "@/shared/auth/permissions";

export interface AppRoute {
  path: string;
  element: React.ReactElement;
  access?: AccessRule;
}

// Ajoutez ici les routes custom React Admin (ex: /courses/:slug/preview)
export const APP_ROUTES: AppRoute[] = [];
