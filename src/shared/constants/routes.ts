export const ROUTES = {
  auth: {
    login: "/login",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
  },
  admin: {
    root: "/admin",
    users: "/admin/users",
    courses: "/admin/courses",
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
  },
} as const;