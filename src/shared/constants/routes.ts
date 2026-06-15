export const ROUTES = {
  auth: {
    login: "/login",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
  },
  platform: {
    login: "/admin/login",
  },
  tenantNotFound: "/tenant-not-found",
  admin: {
    root: "/admin",
    users: "/admin/users",
    courses: "/admin/courses",
    modules: "/admin/modules",
    category: "/admin/category",
    trainees: "/admin/trainees",
    tenants: "/admin/tenants",
    reports: "/admin/reports",
  },
  portal: {
    dashboard: "/dashboard",
    courses: "/courses",
    course: (slug: string) => `/courses/${slug}`,
    lesson: (slug: string, lessonId: string) => `/courses/${slug}/${lessonId}`,
    profile: "/profile",
    certificates: "/certificates",
    users: "/users",
    modules: "/modules",
  },
} as const;
