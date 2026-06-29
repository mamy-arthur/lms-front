"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTenantStore } from "@/shared/stores/tenant.store";
import { LoadingSpinner } from "@/shared/components/feedback/LoadingSpinner";
import type { Tenant } from "@/shared/types/tenant.types";
import { apiGet } from "@/shared/lib/apiClient";

const BASE_DOMAIN = (process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "localhost").split(
    ":",
)[0];

export async function fetchTenantBySlug(): Promise<Tenant> {
    const response = await apiGet<{ data: Tenant }>("/tenant/current");
    return response.data;
}

const LEARNEO_DEFAULT_BRANDING = {
    primary_color: "#2563eb",
    secondary_color: "#64748b",
    fontFamily: "inherit",
} as const;

/**
 * Extrait le slug tenant depuis le hostname.
 *   "acme.learneo.local"  → "acme"
 *   "learneo.local"       → null  (domaine central, pas de tenant)
 *   "localhost"           → null  (domaine central, pas de tenant)
 */
function extractTenantSlug(hostname: string): string | null {
    const clean = hostname.split(":")[0];

    if (clean === BASE_DOMAIN) return null;

    if (clean.endsWith(`.${BASE_DOMAIN}`)) {
        return clean.slice(0, -`.${BASE_DOMAIN}`.length) || null;
    }

    return null;
}

// ---------------------------------------------------------------------------

/**
 * Applique le branding du tenant sur :root via des CSS custom properties.
 * Utilise les valeurs Learneo par défaut pour les champs manquants.
 */
function applyBrandingToDom(tenant: Tenant): void {
    const root = document.documentElement;
    const branding = tenant.branding ?? LEARNEO_DEFAULT_BRANDING;

    // Appliquer les couleurs (avec fallback aux defaults)
    root.style.setProperty("--color-primary", branding.primary_color);
    root.style.setProperty("--color-secondary", branding.secondary_color);

    // Appliquer la font si elle existe
    if (branding.fontFamily) {
        root.style.setProperty("--font-brand", branding.fontFamily);
    }
    // Mettre à jour le favicon
    // const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    // if (favicon?.href && branding.faviconUrl) {
    //     favicon.href = branding.faviconUrl;
    // }
    // Mettre à jour le titre
    document.title = tenant.name;
}

// Vues d'erreur affichées directement dans le provider (sans attendre la navigation)
// pour éviter tout flash de contenu pendant router.replace().
function TenantNotFoundView() {
    return (
        <main style={errorPageStyle}>
            <h1 style={headingStyle}>Organisation introuvable</h1>
            <p style={subtitleStyle}>
                L&apos;adresse que vous avez saisie ne correspond à aucune
                organisation enregistrée.
            </p>
            <p style={hintStyle}>
                Vérifiez l&apos;URL ou contactez votre administrateur.
            </p>
        </main>
    );
}

function TenantInactiveView() {
    return (
        <main style={errorPageStyle}>
            <h1 style={headingStyle}>Organisation désactivée</h1>
            <p style={subtitleStyle}>
                Votre organisation est temporairement inactive.
            </p>
            <p style={hintStyle}>
                Contactez votre administrateur ou le support Learneo.
            </p>
        </main>
    );
}

const errorPageStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "12px",
    fontFamily: "system-ui, sans-serif",
    textAlign: "center",
    padding: "0 24px",
};
const headingStyle: React.CSSProperties = {
    fontSize: "2rem",
    fontWeight: 700,
    margin: 0,
};
const subtitleStyle: React.CSSProperties = {
    color: "#64748b",
    maxWidth: "480px",
    margin: 0,
};
const hintStyle: React.CSSProperties = {
    color: "#94a3b8",
    fontSize: "0.875rem",
    margin: 0,
};

/**
 * Résout le tenant courant au démarrage de l'application depuis le hostname.
 *
 * Comportement :
 *  - Pas de sous-domaine → mode central (admin plateforme), rendu immédiat sans branding
 *  - Sous-domaine valide → charge le tenant, applique le branding, débloque le rendu
 *  - Hostname inconnu (404) → affiche TenantNotFoundView + met à jour l'URL
 *  - Tenant inactif → affiche TenantInactiveView + met à jour l'URL
 *
 * Bloque l'affichage de l'application tant que la résolution n'est pas terminée.
 */
export function TenantProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const setTenant = useTenantStore((s) => s.setTenant);
    const setResolutionStatus = useTenantStore((s) => s.setResolutionStatus);
    const resolutionStatus = useTenantStore((s) => s.resolutionStatus);

    useEffect(() => {
        // Le guard lit depuis le store directement (pas depuis le state React)
        // pour éviter toute dépendance réactive et garantir une exécution unique.
        if (useTenantStore.getState().resolutionStatus !== "idle") return;

        const slug = extractTenantSlug(window.location.hostname);

        // Pas de sous-domaine → mode central : toutes les pages s'affichent sans branding tenant
        if (!slug) {
            setResolutionStatus("resolved");
            return;
        }

        setResolutionStatus("loading");

        // Remplacer mockFetchTenantBySlug par fetchTenantBySlug quand le backend est prêt
        fetchTenantBySlug()
            .then((tenant) => {
                if (!tenant.is_active) {
                    setResolutionStatus("inactive");
                    router.replace("/tenant-inactive");
                    return;
                }
                setTenant(tenant);
                applyBrandingToDom(tenant);
                setResolutionStatus("resolved");
            })
            .catch(() => {
                setResolutionStatus("not-found");
                router.replace("/tenant-not-found");
            });

        // Pas de cleanup : le guard au début de l'effet garantit l'exécution unique.
        // Un cleanup qui remet le status à "idle" créerait une boucle infinie.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // [] intentionnel : la résolution ne doit s'exécuter qu'une seule fois au montage

    if (resolutionStatus === "idle" || resolutionStatus === "loading") {
        return <LoadingSpinner className="h-screen" />;
    }

    // Affichage immédiat des erreurs SANS attendre router.replace(),
    // ce qui évite tout flash de contenu pendant la navigation.
    if (resolutionStatus === "not-found") return <TenantNotFoundView />;
    if (resolutionStatus === "inactive") return <TenantInactiveView />;

    return <>{children}</>;
}
