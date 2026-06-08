import { useAuthStore } from "@/shared/stores/auth.store";
import { useTenantStore } from "@/shared/stores/tenant.store";

/**
 * Retourne le chemin de login adapté au contexte courant.
 * Exporté pour être testé indépendamment.
 */
export function resolveLoginPath(pathname: string): string {
  return pathname.startsWith("/admin") ? "/admin/login" : "/login";
}

export interface HttpOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * Client HTTP centralisé.
 *
 * - credentials: "include" → envoie automatiquement le cookie HttpOnly
 *   posé par le backend lors du login (aucun token en mémoire JS).
 * - Sur 401 : vide le store utilisateur et redirige vers la page de login
 *   correspondant au contexte (/admin/login ou /login).
 */
export const httpClient = async (
  url: string,
  options: HttpOptions = {},
): Promise<{
  status: number;
  headers: Headers;
  body: string;
  json: unknown;
}> => {
  let finalUrl = url;
  if (!url.startsWith("/api") && !url.startsWith("http")) {
    finalUrl = `/api/${url.replace(/^\/+/, "")}`;
  }

  const headers = new Headers(options.headers as HeadersInit | undefined);
  const tenant = useTenantStore.getState().tenant;

  headers.set("Accept", "application/json");
  if (tenant) headers.set("X-Tenant-ID", tenant.id);
  if (options.body) headers.set("Content-Type", "application/json");

  const res = await fetch(finalUrl, {
    ...options,
    headers,
    credentials: "include",
  });

  const body = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    json = body;
  }

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.replace(resolveLoginPath(window.location.pathname));
      }
    }
    const err = Object.assign(new Error(res.statusText), {
      status: res.status,
      headers: res.headers,
      body,
      json,
    });
    throw err;
  }

  return { status: res.status, headers: res.headers, body, json };
};

export async function apiGet<T>(path: string): Promise<T> {
  const { json } = await httpClient(`/api/${path.replace(/^\/+/, "")}`);
  return json as T;
}

export async function apiPost<T, B = unknown>(
  path: string,
  body?: B,
): Promise<T> {
  const { json } = await httpClient(`/api/${path.replace(/^\/+/, "")}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return json as T;
}

export async function apiPut<T, B = unknown>(
  path: string,
  body?: B,
): Promise<T> {
  const { json } = await httpClient(`/api/${path.replace(/^\/+/, "")}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return json as T;
}

export async function apiDelete(path: string): Promise<void> {
  await httpClient(`/api/${path.replace(/^\/+/, "")}`, { method: "DELETE" });
}
