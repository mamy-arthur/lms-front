"use client";
import "@/appConfig/handlers";
import { Admin, Resource, CustomRoutes, usePermissions as usePermissionsRA } from "react-admin";
import { Route } from "react-router-dom";
import { dataProvider } from "./providers/dataProvider";
import { authProvider } from "./providers/authProvider";
import { i18nProvider } from "./providers/i18nProvider";
import { AdminLayout } from "./layout/AdminLayout";
import { APP_ROUTES } from "@/appConfig/routes";
import { canAccess, PermissionSet } from "@/shared/auth/permissions";
import { Role } from "@/shared/constants/roles";
import { SuperAdminDashboard } from "./dashboard/SuperAdminDashboard";
import { ClientManagerDashboard } from "./dashboard/ClientManagerDashboard";

import { UsersList } from "./resources/users/pages/UsersList";
import { CourseList, CourseShow } from "./resources/courses/pages/CourseList";
import { TenantList } from "./resources/tenants/pages/TenantList";
import { TraineeList } from "./resources/trainees/pages/TraineeList";
import { ReportList } from "./resources/reports/pages/ReportList";

// Lit les permissions depuis React Admin et délègue au bon dashboard
function DynamicDashboard() {
  const { permissions } = usePermissionsRA();
  const p = permissions as PermissionSet | null;
  return p?.isSuperAdmin ? <SuperAdminDashboard /> : <ClientManagerDashboard />;
}

export default function AdminApp() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      i18nProvider={i18nProvider}
      layout={AdminLayout}
      basename="/admin"
      dashboard={DynamicDashboard}
    >
      {(permissions: PermissionSet | null) => {
        const p = permissions ?? { role: Role.TRAINEE, isSuperAdmin: false };

        return (
          <>
            <Resource
              name="users"
              list={canAccess(p, { anyRoles: [Role.SUPER_ADMIN, Role.CLIENT_MANAGER] }) ? UsersList : undefined}
            />
            <Resource
              name="courses"
              list={canAccess(p, { anyRoles: [Role.SUPER_ADMIN, Role.EDITOR] }) ? CourseList : undefined}
              show={CourseShow}
            />
            <Resource
              name="trainees"
              list={canAccess(p, { anyRoles: [Role.SUPER_ADMIN, Role.CLIENT_MANAGER] }) ? TraineeList : undefined}
            />
            <Resource
              name="reports"
              list={canAccess(p, { anyRoles: [Role.SUPER_ADMIN, Role.CLIENT_MANAGER] }) ? ReportList : undefined}
            />
            {p.isSuperAdmin && (
              <Resource name="tenants" list={TenantList} />
            )}
            <CustomRoutes>
              {APP_ROUTES.filter((r) => canAccess(p, r.access)).map((r) => (
                <Route key={r.path} path={r.path} element={r.element} />
              ))}
            </CustomRoutes>
          </>
        );
      }}
    </Admin>
  );
}
