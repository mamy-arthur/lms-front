export type TenantStatus = "active" | "suspended" | "trial";
export type TenantPlan = "starter" | "pro" | "enterprise";

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  adminName: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: string; // ISO date string
  avatarColor: string;
  avatarTextColor: string;
  initials: string;
}