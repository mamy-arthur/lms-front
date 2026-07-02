import type { Tenant } from "@/shared/types/tenant.types";

// Données de test pour la résolution des tenants.
// Ce fichier est supprimé dès que le backend GET /api/tenant/current est opérationnel.
const MOCK_TENANTS: Record<string, Tenant> = {
  "globex-fr": {
    id: "tenant-004",
    slug: "globex-fr",
    name: "Globex France",
    domain: "globex-fr.learneo.local",
    status: "active",
    is_active: true,
    branding: {
      primary_color: "#dc2626",
      secondary_color: "#f87171",
      logo_url: "/logo-default.svg",
      favicon_url: "",
      fontFamily: "inherit",
    },
    features: { certificates: true, liveSession: true, customDomain: false },
  },
  "acme": {
    id: "tenant-001",
    slug: "acme",
    name: "Acme Corp",
    domain: "acme.learneo.local",
    status: "active",
    is_active: true,
    branding: {
      primary_color: "#7c3aed",
      secondary_color: "#a78bfa",
      logo_url: "/logo-default.svg",
      favicon_url: "",
      fontFamily: "inherit",
    },
    features: { certificates: true, liveSession: true, customDomain: false },
  },
  "beta": {
    id: "tenant-002",
    slug: "beta",
    name: "Beta School",
    domain: "beta.learneo.local",
    status: "active",
    is_active: true,
    branding: {
      primary_color: "#059669",
      secondary_color: "#6ee7b7",
      logo_url: "/logo-default.svg",
      favicon_url: "",
      fontFamily: "inherit",
    },
    features: { certificates: false, liveSession: true, customDomain: false },
  },
  "suspended": {
    id: "tenant-003",
    slug: "suspended",
    name: "Suspended Org",
    domain: "suspended.learneo.local",
    status: "suspended",
    is_active: false,
    branding: {
      primary_color: "#2563eb",
      secondary_color: "#64748b",
      logo_url: "/logo-default.svg",
      favicon_url: "",
      fontFamily: "inherit",
    },
    features: { certificates: false, liveSession: false, customDomain: false },
  },
};

export async function mockFetchTenantBySlug(slug: string): Promise<Tenant> {
  // Simule la latence réseau (~300ms)
  await new Promise<void>((resolve) => setTimeout(resolve, 300));

  const tenant = MOCK_TENANTS[slug];

  if (!tenant) {
    const error = new Error(`Tenant not found: "${slug}"`);
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  return tenant;
}
