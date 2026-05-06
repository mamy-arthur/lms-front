export const tenantKeys = {
  all: ["tenant"] as const,
  current: () => [...tenantKeys.all, "current"] as const,
};

export const platformTenantKeys = {
  all: ["platform", "tenants"] as const,
  lists: () => [...platformTenantKeys.all, "list"] as const,
  list: (filters: object) => [...platformTenantKeys.lists(), filters] as const,
  detail: (id: string) => [...platformTenantKeys.all, "detail", id] as const,
};

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: object) => [...userKeys.lists(), filters] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (filters: object) => [...courseKeys.lists(), filters] as const,
  detail: (slug: string) => [...courseKeys.all, "detail", slug] as const,
};
